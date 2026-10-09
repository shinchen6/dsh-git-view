/**
 * Parser checks against real git output.
 *
 * The three parsers read wire formats nothing else in the package depends on, so
 * this builds a throwaway repository, provokes each porcelain v2 record kind,
 * and asserts the shape the browser half renders from.
 *
 * Run with: node test/parsers.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

import { parsePorcelainV2, parseNumstat, parseUnifiedDiff } from '../index.js';

const repo = mkdtempSync(join(tmpdir(), 'dsh-git-view-test-'));
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
const raw = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'buffer' }).toString('latin1');

let failures = 0;
/**
 * Assert one case and report it.
 *
 * @param {string} name - case name.
 * @param {() => void} body - the assertions.
 */
function check(name, body) {
  try {
    body();
    process.stdout.write(`  ok  ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stdout.write(`FAIL  ${name}\n      ${error.message.split('\n').join('\n      ')}\n`);
  }
}

try {
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  writeFileSync(join(repo, 'a.txt'), 'one\ntwo\nthree\n');
  writeFileSync(join(repo, 'keep.txt'), 'keep\n');
  git('add', '-A');
  git('commit', '-qm', 'init');

  // One ordinary modification, one staged addition, one untracked file.
  writeFileSync(join(repo, 'a.txt'), 'one\nTWO\nthree\nfour\n');
  writeFileSync(join(repo, 'b.txt'), 'staged\n');
  writeFileSync(join(repo, 'notes.md'), '# notes\n');
  git('add', 'b.txt');

  check('porcelain v2 reads branch facts and every group', () => {
    const { branch, entries } = parsePorcelainV2(raw('status', '--porcelain=v2', '-z', '--branch', '--untracked-files=all'));
    assert.equal(branch.name, 'main');
    assert.equal(branch.detached, false);
    assert.match(branch.oid, /^[0-9a-f]{40}$/);
    const byPath = Object.fromEntries(entries.map(entry => [entry.path, entry]));
    assert.equal(byPath['a.txt'].unstaged, true);
    assert.equal(byPath['a.txt'].staged, false);
    assert.equal(byPath['a.txt'].status, 'M');
    assert.equal(byPath['b.txt'].staged, true);
    assert.equal(byPath['b.txt'].status, 'A');
    assert.equal(byPath['notes.md'].status, '?');
  });

  check('porcelain v2 reads upstream ahead and behind', () => {
    // Its own origin and clone: this case commits, so it must not touch the
    // working tree the other cases read.
    const origin = mkdtempSync(join(tmpdir(), 'dsh-git-view-origin-'));
    // git clone refuses an existing directory, so the target is only named here.
    const clone = join(tmpdir(), `dsh-git-view-clone-${process.pid}-${Date.now()}`);
    try {
      for (const dir of [origin]) {
        execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
        execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
        execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
      }
      writeFileSync(join(origin, 'seed.txt'), 'seed\n');
      execFileSync('git', ['add', '-A'], { cwd: origin });
      execFileSync('git', ['commit', '-qm', 'seed'], { cwd: origin });
      execFileSync('git', ['clone', '-q', origin, clone], { cwd: tmpdir() });

      writeFileSync(join(origin, 'remote.txt'), 'remote\n');
      execFileSync('git', ['add', '-A'], { cwd: origin });
      execFileSync('git', ['commit', '-qm', 'remote work'], { cwd: origin });
      execFileSync('git', ['fetch', '-q', 'origin'], { cwd: clone });

      writeFileSync(join(clone, 'local.txt'), 'local\n');
      execFileSync('git', ['add', '-A'], { cwd: clone });
      execFileSync('git', ['commit', '-qm', 'local work'], { cwd: clone });

      const { branch } = parsePorcelainV2(
        execFileSync('git', ['status', '--porcelain=v2', '-z', '--branch'], {
          cwd: clone,
          encoding: 'buffer',
        }).toString('latin1'),
      );
      assert.equal(branch.upstream, 'origin/main');
      assert.equal(branch.ahead, 1);
      assert.equal(branch.behind, 1);
    } finally {
      rmSync(origin, { recursive: true, force: true });
      rmSync(clone, { recursive: true, force: true });
    }
  });

  check('numstat counts both sides and flags binary content', () => {
    const staged = parseNumstat(raw('diff', '--numstat', '-z', '--cached'));
    assert.deepEqual(staged.get('b.txt'), { added: 1, deleted: 0, binary: false });
    const unstaged = parseNumstat(raw('diff', '--numstat', '-z'));
    assert.deepEqual(unstaged.get('a.txt'), { added: 2, deleted: 1, binary: false });
    writeFileSync(join(repo, 'blob.bin'), Buffer.from([0, 1, 2, 3]));
    execFileSync('git', ['add', '-N', 'blob.bin'], { cwd: repo });
    const withBinary = parseNumstat(raw('diff', '--numstat', '-z'));
    assert.equal(withBinary.get('blob.bin')?.binary, true);
  });

  check('unified diff becomes hunks with both line numbers', () => {
    const { hunks, before, after } = parseUnifiedDiff(raw('--no-pager', 'diff', '-U3', '--', 'a.txt'));
    assert.equal(before, true);
    assert.equal(after, true);
    assert.equal(hunks.length, 1);
    const [hunk] = hunks;
    assert.equal(hunk.oldStart, 1);
    assert.equal(hunk.newStart, 1);
    assert.deepEqual(hunk.lines, [' one', '-two', '+TWO', ' three', '+four']);
    assert.equal(hunk.lines.filter(line => line.startsWith('+')).length, 2);
  });

  check('an added file reads as wholly new', () => {
    const { hunks, before, after } = parseUnifiedDiff(raw('--no-pager', 'diff', '-U3', '--cached', '--', 'b.txt'));
    assert.equal(before, false);
    assert.equal(after, true);
    assert.deepEqual(hunks[0].lines, ['+staged']);
  });

  check('a removed file reads as wholly deleted', () => {
    rmSync(join(repo, 'keep.txt'));
    const { hunks, before, after } = parseUnifiedDiff(raw('--no-pager', 'diff', '-U3', '--', 'keep.txt'));
    assert.equal(before, true);
    assert.equal(after, false);
    assert.deepEqual(hunks[0].lines, ['-keep']);
  });
} finally {
  rmSync(repo, { recursive: true, force: true });
}

process.stdout.write(failures === 0 ? '\nall parser checks passed\n' : `\n${failures} parser check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);