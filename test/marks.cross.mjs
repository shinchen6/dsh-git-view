// Cross-check the client's marks against what git actually changed.
//
// Runs against a throwaway repository built here rather than against whatever
// happens to be open, because the interesting cases — a deletion, a deletion
// before the first line, a file with no unstaged change at all — cannot all be
// arranged on demand in a working repository somebody is using.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseUnifiedDiff } from '../index.js';
import { markChanges } from '../src/marks.js';

const root = mkdtempSync(join(tmpdir(), 'dsh-git-marks-'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

let failures = 0;
const fail = message => {
  failures += 1;
  process.stdout.write(`        ${message}\n`);
};

// A repository with one commit and a working tree covering every shape that can
// make the numbering go wrong.
mkdirSync(join(root, 'src'), { recursive: true });
writeFileSync(join(root, 'src', 'base.js'), [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven',
].join('\n') + '\n');
writeFileSync(join(root, 'src', 'onlystaged.js'), ['a', 'b', 'c', 'd'].join('\n') + '\n');
writeFileSync(join(root, 'headgone.js'), ['gone', 'after'].join('\n') + '\n');
git('init', '-q');
git('config', 'user.email', 'marks@example.invalid');
git('config', 'user.name', 'Marks Check');
git('add', '-A');
git('commit', '-qm', 'base');

// Staged: an addition in the middle and a deletion before it.
writeFileSync(join(root, 'src', 'onlystaged.js'), ['a', 'NEW', 'c', 'd'].join('\n') + '\n');
// Unstaged: a deletion after line 2, and a deletion of the final line.
writeFileSync(join(root, 'src', 'base.js'), ['one', 'two', 'four', 'five', 'six', 'seven'].join('\n') + '\n');
// Unstaged deletion of a whole file: the resulting file does not exist.
rmSync(join(root, 'headgone.js'));
git('add', 'src/onlystaged.js');

const cases = [
  {
    name: 'staged addition plus deletion',
    path: 'src/onlystaged.js',
    cached: true,
    expectAdded: [2],
    expectRemoved: [{ at: 1, count: 1 }],
    lines: 4,
  },
  {
    name: 'unstaged deletion at the start of a run',
    path: 'src/base.js',
    cached: false,
    expectAdded: [],
    expectRemoved: [{ at: 2, count: 1 }],
    lines: 6,
  },
];

for (const item of cases) {
  const args = ['diff', '-U3', ...(item.cached ? ['--cached'] : []), '--', item.path];
  const diff = parseUnifiedDiff(git(...args));
  const { added, removed } = markChanges(diff.hunks);

  const [realAdded, realDeleted] = git('diff', '--numstat', ...(item.cached ? ['--cached'] : []), '--', item.path)
    .trim()
    .split('\t')
    .map(Number);

  process.stdout.write(`  ${item.name}: ${item.path}\n`);
  process.stdout.write(`        added=[${added}] removed=${JSON.stringify(removed)}  git: +${realAdded} -${realDeleted}\n`);

  if (added.length !== realAdded) fail(`marked ${added.length} additions, git says ${realAdded}`);
  if (removed.reduce((sum, b) => sum + b.count, 0) !== realDeleted) fail('marked deletions disagree with git');
  if (JSON.stringify(added) !== JSON.stringify(item.expectAdded)) fail(`expected added [${item.expectAdded}]`);
  if (JSON.stringify(removed) !== JSON.stringify(item.expectRemoved)) fail(`expected removed ${JSON.stringify(item.expectRemoved)}`);

  // Every marker has to land inside the file it describes, or the whole-file
  // view draws past its last line.
  const lineCount = item.cached
    ? git('show', `:${item.path}`).split('\n').length - 1
    : item.lines;
  for (const no of added) if (no < 1 || no > lineCount) fail(`added ${no} outside 1..${lineCount}`);
  for (const block of removed) {
    if (block.at < 0 || block.at > lineCount) fail(`deletion anchored at ${block.at}, file has ${lineCount} lines`);
  }
}

rmSync(root, { recursive: true, force: true });
process.stdout.write(failures === 0 ? '\nmarks agree with git\n' : `\n${failures} mismatch(es)\n`);
process.exit(failures === 0 ? 0 : 1);