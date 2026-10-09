// The tree is the one part of the panel whose failures are silent: a row that
// does not appear looks like a repository with nothing in it, and a folder that
// folds to nothing looks like an empty folder. So the shape is checked directly.
import { buildTree } from '../src/treebuild.js';

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

process.stdout.write(failures === 0 ? '\nall tree checks passed\n' : `\n${failures} tree check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);