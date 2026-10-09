// The marks are how the whole-file view knows where the change is, and a wrong
// mark is worse than no mark: it highlights lines that did not change.
import { markChanges } from '../src/marks.js';

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

const hunk = (newStart, lines) => ({ oldStart: newStart, oldLines: lines.length, newStart, newLines: lines.length, lines });

check('an addition is marked at its own line number in the new file', () => {
  const { added, removed } = markChanges([hunk(1, [' a', ' b', '+c', ' d'])]);
  eq(added, [3], 'added');
  eq(removed, [], 'removed');
});

check('the counter runs across unchanged lines, not just inside the hunk', () => {
  // The hunk starts at new line 10, so the first `+` is line 10, not line 2.
  const { added } = markChanges([hunk(10, [' a', '+b'])]);
  eq(added, [11], 'added');
});

check('several hunks continue the same numbering', () => {
  const { added } = markChanges([
    hunk(1, [' a', '+b']),
    hunk(5, ['+e', ' f']),
  ]);
  eq(added, [2, 5], 'added');
});

check('deletions are anchored to the line they precede', () => {
  // Line 4 is removed; line 5 is the next thing in the new file.
  const { added, removed } = markChanges([hunk(1, [' a', ' b', '-gone', ' c'])]);
  eq(added, [], 'added');
  eq(removed, [{ at: 2, count: 1 }], 'removed');
});

check('consecutive deletions collapse into one marker', () => {
  const { removed } = markChanges([hunk(1, [' a', '-b', '-c', '-d', ' e'])]);
  eq(removed, [{ at: 1, count: 3 }], 'removed');
});

check('a deletion before the first line anchors at zero', () => {
  const { removed } = markChanges([hunk(1, ['-a', '-b', ' c'])]);
  eq(removed, [{ at: 0, count: 2 }], 'removed');
});

check('a delete-then-add pair is one marker and one addition', () => {
  const { added, removed } = markChanges([hunk(1, [' a', '-old', '+new', ' b'])]);
  eq(added, [2], 'added');
  eq(removed, [{ at: 1, count: 1 }], 'removed');
});

check('an entirely new file marks every line', () => {
  const { added, removed } = markChanges([hunk(1, ['+a', '+b', '+c'])]);
  eq(added, [1, 2, 3], 'added');
  eq(removed, [], 'removed');
});

check('an empty comparison marks nothing rather than throwing', () => {
  eq(markChanges([]), { added: [], removed: [] }, 'empty');
  eq(markChanges(undefined), { added: [], removed: [] }, 'undefined');
});

check('a deletion block is not merged across an intervening addition', () => {
  // Two separate removals with an addition between them are two events; merging
  // them would put one marker in the wrong place and misreport the count.
  const { added, removed } = markChanges([hunk(1, ['-a', '+x', '-b', '+y'])]);
  eq(added, [1, 2], 'added');
  eq(removed, [{ at: 0, count: 1 }, { at: 1, count: 1 }], 'removed');
});

process.stdout.write(failures === 0 ? '\nall mark checks passed\n' : `\n${failures} mark check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);