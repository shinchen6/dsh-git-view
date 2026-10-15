// The tree is the one part of the panel whose failures are silent: a row that
// does not appear looks like a repository with nothing in it, and a folder that
// folds to nothing looks like an empty folder. So the shape is checked directly.
import { readFileSync } from 'node:fs';
import { buildTree, dirKey, sideOf } from '../src/treebuild.js';

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    process.stdout.write(`  ok  ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stdout.write(`  FAIL  ${name} — ${error.message}\n`);
  }
};
const eq = (actual, expected, what) => {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${what}: expected ${b}, got ${a}`);
};
const file = path => ({ path, status: '?', added: 0, deleted: 0 });
const dirEntry = path => ({ ...file(path), dir: true });
const at = (root, path) =>
  path === '' ? root : path.split('/').reduce((node, part) => node.dirs.find(d => d.name === part), root);
const names = node => [...node.dirs.map(d => d.name), ...node.files.map(f => f.name)];

check('a nested file builds the folders above it', () => {
  const root = buildTree([file('src/api/users.js')]);
  eq(names(root), ['src'], 'root');
  eq(names(at(root, 'src')), ['api'], 'src');
  eq(names(at(root, 'src/api')), ['users.js'], 'src/api');
  // A folder's own row stages everything under it, and that button works off
  // this list — so the file has to be on both folders it belongs to.
  eq(at(root, 'src').all.map(f => f.path), ['src/api/users.js'], 'src can stage its subtree');
  eq(at(root, 'src/api').all.map(f => f.path), ['src/api/users.js'], 'src/api can stage its subtree');
});

check('files at the root stay at the root', () => {
  const root = buildTree([file('README.md'), file('main.js')]);
  eq(names(root), ['README.md', 'main.js'], 'root');
});

check('a folder holding files counts each of them once', () => {
  // The folder row sums its files' added and removed totals. A file appended
  // twice to the same folder made the folder report twice the change of the only
  // file inside it — which is what put "+4 -2" beside `api/` when `users.js`
  // under it was "+2 -1".
  const root = buildTree([file('api/users.js')]);
  eq(at(root, 'api').all.map(f => f.path), ['api/users.js'], 'counted once');
  const sum = node => node.all.reduce((total, f) => total + (f.added ?? 0), 0);
  const one = buildTree([{ ...file('api/users.js'), added: 2 }]);
  eq(sum(at(one, 'api')), 2, 'the folder total is the file total');
  eq(sum(root), 0, 'a root with no direct files sums to nothing');
});

check('an untracked directory is one node with no children', () => {
  // This is the shape the status scan now sends. If it came out as a leaf, the
  // folder would read as a file with a slash in its name.
  const root = buildTree([dirEntry('postgresql16/')]);
  eq(names(root), ['postgresql16'], 'root holds the folder');
  const node = at(root, 'postgresql16');
  eq(names(node), [], 'and nothing inside it yet');
  eq(node.path, 'postgresql16', 'its path has no trailing slash');
});

check('an untracked directory can still be staged as a whole', () => {
  // The folder row's stage button works off its node's file list, so the
  // placeholder has to be in it or the button would have nothing to pass on.
  const root = buildTree([dirEntry('bundle/')]);
  eq(at(root, 'bundle').all.map(f => f.path), ['bundle/'], 'the placeholder is the path git wants');
});

check('opening a directory replaces its placeholder with its files', () => {
  const closed = buildTree([dirEntry('t/')]);
  eq(names(at(closed, 't')), [], 'closed');
  // What the view does once the answer arrives: the entry is swapped out.
  const open = buildTree([file('t/api/users.js'), file('t/util/date.js')]);
  eq(names(open), ['t'], 't is still one top-level folder');
  eq(names(at(open, 't')), ['api', 'util'], 'with its folders');
  eq(names(at(open, 't/api')), ['users.js'], 'and their files');
});

check('an untracked folder inside a tracked folder is found, not flattened', () => {
  const root = buildTree([file('src/main.js'), dirEntry('src/new/')]);
  eq(names(root), ['src'], 'root');
  eq(names(at(root, 'src')), ['new', 'main.js'], 'src keeps both kinds');
  eq(names(at(root, 'src/new')), [], 'the untracked folder is still closed');
});

check('an empty directory entry never produces a nameless row', () => {
  // `t/`.split('/') is ['t', '']; a naive walk would make a folder whose name is
  // the empty string, which renders as a blank row.
  const root = buildTree([dirEntry('t/'), file('t/a.js')]);
  eq(root.dirs.some(d => d.name === ''), false, 'no empty-named folder');
  eq(names(root), ['t'], 'root');
});

check('the same folder reported twice is still one folder', () => {
  const root = buildTree([dirEntry('a/'), dirEntry('b/'), file('a/x.js')]);
  eq(names(root), ['a', 'b'], 'root');
  eq(at(root, 'a').dirs.length, 0, 'a has no folder of its own');
  eq(names(at(root, 'a')), ['x.js'], 'a holds the file that arrived');
});

// The two halves of folding a directory shut are written a long way from each
// other: the view records the key when a directory should start closed, and the
// tree reads it back to decide whether to skip the subtree. When they disagree
// nothing throws and nothing looks broken — the folder simply comes up open, and
// the panel lists files the Host never sent. That is what happened when the
// untracked files moved into the Changes group and the writer kept the old
// `untracked:` prefix, so the key is pinned here from both sides.
check('a folded directory is recorded under the side it hangs from', () => {
  eq(dirKey('unstaged', '.codebuddy'), 'unstaged:.codebuddy', 'an untracked directory in the Changes group');
  eq(dirKey('staged', 't/api'), 'staged:t/api', 'a staged directory');

  // The view writes the key for untracked directories, which now hang from the
  // working tree. It must not be the prefix of a group that no longer exists.
  eq(dirKey('unstaged', '.kiro').startsWith('untracked:'), false, 'no untracked: prefix survives the merge');

  const collapsed = new Set([dirKey('unstaged', '.codebuddy')]);
  eq(collapsed.has(dirKey('unstaged', '.codebuddy')), true, 'the tree finds the key the view wrote');
});

// Checking dirKey alone proved nothing: the defect was never in dirKey, it was
// in a call site that stopped calling it and spelled the key by hand instead.
// So the guard has to read the two files that must agree.
check('neither half of the fold spells the key by hand', () => {
  const tree = readFileSync(new URL('../src/tree.jsx', import.meta.url), 'utf8');
  const view = readFileSync(new URL('../src/view.jsx', import.meta.url), 'utf8');

  if (!tree.includes('dirKey(')) throw new Error('tree.jsx no longer folds through dirKey');
  if (!view.includes('dirKey(')) throw new Error('view.jsx no longer folds through dirKey');

  // A hand-written key in either file is the defect, whatever it happens to say.
  const handWritten = [tree, view].filter(s => /`\$\{[^}]+\}:\$\{[^}]+\}`/.test(s));
  if (handWritten.length > 0) throw new Error('a folder key is spelled out by hand instead of going through dirKey');

  const stale = [tree, view].filter(s => /['"]untracked:/.test(s));
  if (stale.length > 0) throw new Error("the 'untracked:' fold key is back; no group carries that name any more");
});

check('an untracked row is discarded with git clean, not git checkout', () => {
  // Untracked files sit in the Changes group with the tracked ones, so the
  // group cannot say what discarding means. Reading the side off the group
  // would offer `git checkout` for a file that is not in the index — which
  // restores nothing, or errors, and either way is not deleting the file the
  // `?` is promising.
  eq(sideOf({ status: '?' }, 'unstaged'), 'untracked', 'an untracked row in Changes');
  eq(sideOf({ status: 'M' }, 'unstaged'), 'unstaged', 'a tracked edit in Changes');
  eq(sideOf({ status: '?' }, 'staged'), 'staged', 'a staged row is never cleaned');
  eq(sideOf({ status: 'U' }, 'unstaged'), 'unstaged', 'a conflict is restored, not deleted');
});

process.stdout.write(failures === 0 ? '\nall tree checks passed\n' : `\n${failures} tree check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);