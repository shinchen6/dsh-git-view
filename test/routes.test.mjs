/**
 * Route checks against a real repository.
 *
 * These exercise the whole node half — session lookup, repository discovery,
 * git invocation, porcelain parsing, and the JSON each route serves — with the
 * subprocess capability stubbed onto `child_process.spawnSync` so the git being
 * run is the real one. What stays stubbed is only the sandbox around it.
 *
 * Run with: node test/routes.test.mjs
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, statSync, lstatSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
import assert from 'node:assert/strict';

import { apply } from '../index.js';

const repo = mkdtempSync(join(tmpdir(), 'dsh-git-view-routes-'));

/** Collects every route the plugin registers. */
const routes = new Map();

/** A session store that always reports the scratch repository. */
const sessions = { get: () => ({ header: { cwd: repo } }) };

/** The absolute path to the real git, as a subprocess provider would resolve it. */
const gitPath = execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', ['git'], { encoding: 'utf8' })
  .split(/\r?\n/)[0]
  .trim();

/** Every git invocation the routes made, so caching is observable rather than assumed. */
const gitCalls = [];

/**
 * The working directories a status scan has been run in, in order.
 *
 * Matched on the whole recorded command line: the first argument is the git
 * executable's path, so a prefix test against `status` never matches anything
 * and would let a cache test pass without a single call being counted.
 *
 * @returns {string[]} the directories scanned so far.
 */
const scannedDirs = () =>
  gitCalls.filter(call => /(^|\s)status --porcelain=v2/.test(call.line)).map(call => call.cwd);

/** The subprocess capability, backed by real git through spawnSync. */
const subprocess = {
  resolveExecutable: () => Promise.resolve(gitPath),
  spawn(spec) {
    gitCalls.push({ line: spec.argv.join(' '), cwd: spec.cwd });
    const result = spawnSync(spec.argv[0], spec.argv.slice(1), {
      cwd: spec.cwd,
      env: { ...process.env, ...spec.env },
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      input: spec.stdin === 'ignore' ? undefined : spec.stdin?.data,
    });
    const stdout = { text: result.stdout ?? '', readFrom: () => ({ text: result.stdout ?? '', lossy: false }) };
    const stderr = { text: result.stderr ?? '', readFrom: () => ({ text: result.stderr ?? '' }) };
    return {
      collected: { stdout, stderr },
      done: Promise.resolve({ exitCode: result.status, signal: null }),
    };
  },
};

/** The filesystem capability, backed by the real one for this scratch tree. */
const fs = {
  resolve: async path => ({ path: resolvePath(path) }),
  stat: async target => {
    const info = statSync(target.path);
    return { type: info.isDirectory() ? 'directory' : 'file', size: info.size, version: `v${info.mtimeMs}-${info.size}` };
  },
  readBytes: async target => new Uint8Array(readFileSync(target.path)),
  // Directory listing and a non-following stat of a single entry: the two calls
  // repository discovery makes. Absent here, discovery would silently fall back
  // to "only the enclosing repository" and these checks would prove nothing.
  listDir: async target => readdirSync(target.path, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      target: { path: resolvePath(target.path, entry.name), displayPath: resolvePath(target.path, entry.name) },
    })),
  lstat: async (path, _opts) => {
    const info = lstatSync(path);
    return { type: info.isDirectory() ? 'directory' : 'file', size: info.size };
  },
  processPath: target => target.path,
  writeText: async (target, content, expected, signal, policy) => {
    // The real backend takes a tagged intent and a sandbox policy, and both
    // decide whether the write happens. Enforcing them here is what makes this
    // stub able to catch a caller that passes the wrong shape.
    if (policy?.mode !== 'workspace-write') throw new Error('no sandbox policy: file access denied');
    if (policy.workspaceRoot !== repo) throw new Error('file access denied under workspace-write mode');
    if (expected !== undefined) {
      assert.equal(expected.kind, 'replaceIfVersion', 'the intent must be the version arm of the union');
      const info = statSync(target.path);
      if (expected.version !== `v${info.mtimeMs}-${info.size}`) {
        const stale = new Error('the file moved since it was read');
        stale.code = 'FS_STALE_VERSION';
        throw stale;
      }
    }
    const before = readFileSync(target.path, 'utf8');
    writeFileSync(target.path, content);
    return { created: false, version: `v${statSync(target.path).mtimeMs}-${content.length}`, before, after: content };
  },
};

/** Every stream the fake model hands back, so a test can assert what was sent. */
const llmCalls = [];

/** A fake model that streams one fixed commit message back as text deltas. */
const llm = {
  async *stream(options) {
    llmCalls.push(options);
    const reply = process.env.TEST_COMMIT_MESSAGE ?? 'feat(ui): add the git view';
    for (const piece of reply.match(/.{1,7}/gs)) {
      yield { type: 'text-delta', index: 0, text: piece };
    }
    yield { type: 'finish', reason: { kind: 'stop' } };
  },
};

/** The profile's configured model, as `agentDefaultModel` reports it. */
const agentDefaultModel = { currentSelection: () => ({ provider: 'test-provider', model: 'test-model' }) };

const services = new Map([
  ['llm', llm],
  ['agentDefaultModel', agentDefaultModel],
]);

apply({
  connection: { fetch: { register: route => routes.set(route.path, route) } },
  sessions,
  subprocess,
  fs,
  logger: { warn: () => {} },
  get: name => services.get(name),
  // Cordis disposes effects on unload; here only the disposer is needed.
  effect: callback => {
    const disposer = callback();
    return typeof disposer === 'function' ? disposer : () => {};
  },
});

let failures = 0;
/**
 * Assert one case and report it.
 *
 * @param {string} name - case name.
 * @param {() => Promise<void>} body - the assertions.
 */
async function check(name, body) {
  try {
    await body();
    process.stdout.write(`  ok  ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stdout.write(`FAIL  ${name}\n      ${error.message.split('\n').join('\n      ')}\n`);
  }
}

/**
 * Call one registered route and decode its answer.
 *
 * @param {string} path - route path.
 * @param {Record<string, string>} query - query parameters.
 * @returns {Promise<{ status: number, body: any }>} the answer.
 */
function call(path, query) {
  const route = routes.get(path);
  assert.ok(route, `route ${path} was never registered`);
  const url = `http://127.0.0.1${path}?${new URLSearchParams(query)}`;
  return route.fetch(new Request(url, { signal: new AbortController().signal })).then(async response => ({
    status: response.status,
    body: await response.json().catch(() => null),
  }));
}

/**
 * Run one action the way the browser would.
 *
 * @param {object} body - the action body.
 * @returns {Promise<any>} the decoded answer.
 */
function post(body) {
  const route = routes.get('/api/git.action');
  return route
    .fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
    .then(async response => {
      const text = await response.text();
      assert.equal(response.status, 200, `${JSON.stringify(body)} answered ${response.status}: ${text}`);
      return JSON.parse(text);
    });
}

/**
 * Run one action against a named repository, the way the browser would.
 *
 * `post` always addresses the enclosing repository; this is for the nested ones,
 * whose cache entry is keyed by their own root.
 *
 * @param {string} repo - the repository root to act on.
 * @param {object} body - the action body.
 * @returns {Promise<any>} the decoded answer.
 */
function postIn(repo, body) {
  const route = routes.get('/api/git.action');
  const query = new URLSearchParams({ sessionId: 's', repo });
  return route
    .fetch(
      new Request(`http://127.0.0.1/api/git.action?${query}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
    .then(async response => {
      const text = await response.text();
      assert.equal(response.status, 200, `${JSON.stringify(body)} answered ${response.status}: ${text}`);
      return JSON.parse(text);
    });
}

/**
 * Create a repository nested inside the scratch one, at a given relative path.
 *
 * @param {string} relative - directory under the scratch repository.
 * @returns {string} the absolute path of the new repository.
 */
function nestedRepo(relative) {
  const path = join(repo, relative);
  mkdirSync(path, { recursive: true });
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: path });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: path });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: path });
  writeFileSync(join(path, 'own.txt'), `own ${relative}\n`);
  execFileSync('git', ['add', '-A'], { cwd: path });
  execFileSync('git', ['commit', '-q', '-m', `init ${relative}`], { cwd: path });
  return path;
}

try {
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
  // Keep git from rewriting line endings, so byte comparisons mean what they say.
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: repo });
  writeFileSync(join(repo, 'app.ts'), 'const a = 1\nconst b = 2\n');
  writeFileSync(join(repo, 'notes.md'), '# notes\n\nhello\n');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'init'], { cwd: repo });

  writeFileSync(join(repo, 'app.ts'), 'const a = 1\nconst b = 20\nconst c = 3\n');
  writeFileSync(join(repo, 'notes.md'), '# notes\n\nhello world\n');
  writeFileSync(join(repo, 'added.txt'), 'brand new\n');
  execFileSync('git', ['add', 'notes.md'], { cwd: repo });

  await check('status serves the branch and every group', async () => {
    const { status, body } = await call('/api/git.status', { sessionId: 's' });
    assert.equal(status, 200);
    assert.equal(body.available, true);
    assert.equal(body.repo.name, repo.replace(/[\\/]+$/, '').split(/[\\/]/).pop());
    assert.equal(body.repo.branch, 'main');
    assert.equal(body.repo.detached, false);
    assert.equal(body.clean, false);
    assert.deepEqual(body.staged.map(f => f.path), ['notes.md']);
    assert.deepEqual(body.unstaged.map(f => f.path), ['app.ts']);
    assert.deepEqual(body.untracked.map(f => f.path), ['added.txt']);
    assert.equal(body.staged[0].status, 'M');
    assert.equal(body.untracked[0].status, '?');
  });

  await check('status counts the lines each side changed', async () => {
    const { body } = await call('/api/git.status', { sessionId: 's' });
    assert.deepEqual(
      { added: body.unstaged[0].added, deleted: body.unstaged[0].deleted },
      { added: 2, deleted: 1 },
    );
  });

  await check('a clean tree reports clean', async () => {
    const saved = readFileSync(join(repo, 'added.txt'), 'utf8');
    rmSync(join(repo, 'added.txt'));
    execFileSync('git', ['checkout', '--', 'app.ts'], { cwd: repo });
    execFileSync('git', ['reset', '-q', 'HEAD', '--', 'notes.md'], { cwd: repo });
    execFileSync('git', ['checkout', '--', 'notes.md'], { cwd: repo });
    const { body } = await call('/api/git.status', { sessionId: 's' });
    assert.equal(body.clean, true);
    assert.deepEqual(body.staged, []);
    writeFileSync(join(repo, 'added.txt'), saved);
    writeFileSync(join(repo, 'app.ts'), 'const a = 1\nconst b = 20\nconst c = 3\n');
    writeFileSync(join(repo, 'notes.md'), '# notes\n\nhello world\n');
    execFileSync('git', ['add', 'notes.md'], { cwd: repo });
  });

  await check('the staged side reads its own comparison', async () => {
    const { body } = await call('/api/git.diff', { sessionId: 's', path: 'notes.md', side: 'staged' });
    assert.equal(body.kind, 'text');
    assert.deepEqual(
      body.hunks[0].lines.filter(line => line.startsWith('+') || line.startsWith('-')),
      ['-hello', '+hello world'],
    );
  });

  await check('the unstaged side reads the working tree comparison', async () => {
    const { body } = await call('/api/git.diff', { sessionId: 's', path: 'app.ts', side: 'unstaged' });
    assert.equal(body.kind, 'text');
    assert.ok(body.hunks[0].lines.includes('-const b = 2'));
    assert.ok(body.hunks[0].lines.includes('+const c = 3'));
  });

  await check('an untracked file reads as wholly new', async () => {
    const { body } = await call('/api/git.diff', { sessionId: 's', path: 'added.txt', side: 'untracked' });
    assert.equal(body.before, false);
    assert.deepEqual(body.hunks[0].lines, ['+brand new']);
  });

  await check('a binary file is listed but refused a comparison', async () => {
    writeFileSync(join(repo, 'blob.bin'), Buffer.from([0x00, 0x01, 0x02, 0x00]));
    execFileSync('git', ['add', '-N', 'blob.bin'], { cwd: repo });
    const { body: listed } = await call('/api/git.status', { sessionId: 's' });
    assert.equal(listed.unstaged.find(f => f.path === 'blob.bin')?.binary, true);
    const { body } = await call('/api/git.diff', { sessionId: 's', path: 'blob.bin', side: 'unstaged' });
    assert.equal(body.kind, 'binary');
  });

  await check('the file route serves each side whole', async () => {
    const worktree = await call('/api/git.file', { sessionId: 's', path: 'notes.md', side: 'worktree' });
    assert.equal(worktree.body.text, '# notes\n\nhello world\n');
    const head = await call('/api/git.file', { sessionId: 's', path: 'notes.md', side: 'head' });
    assert.equal(head.body.text, '# notes\n\nhello\n');
    const staged = await call('/api/git.file', { sessionId: 's', path: 'notes.md', side: 'staged' });
    assert.equal(staged.body.text, '# notes\n\nhello world\n');
  });

  await check('the file route refuses a binary side', async () => {
    const { body } = await call('/api/git.file', { sessionId: 's', path: 'blob.bin', side: 'worktree' });
    assert.equal(body.kind, 'binary');
  });

  await check('an unknown path is refused rather than invented', async () => {
    const { status } = await call('/api/git.file', { sessionId: 's', path: 'nope.txt', side: 'worktree' });
    assert.equal(status, 404);
  });

  await check('a missing session identity is refused', async () => {
    const { status } = await call('/api/git.status', {});
    assert.equal(status, 400);
  });

  // --- write actions, from a known-clean state -------------------------------
  execFileSync('git', ['reset', '-q', 'HEAD', '--', '.'], { cwd: repo });
  execFileSync('git', ['checkout', '--', '.'], { cwd: repo });
  rmSync(join(repo, 'added.txt'), { force: true });
  rmSync(join(repo, 'blob.bin'), { force: true });
  execFileSync('git', ['stash', 'clear'], { cwd: repo });

  await check('a path that could leave the repository is refused', async () => {
    for (const path of ['../escape.txt', 'a/../../b', 'C:/Windows/system32', '--upload-pack=touch']) {
      const route = routes.get('/api/git.action');
      const response = await route.fetch(
        new Request('http://127.0.0.1/api/git.action?sessionId=s', {
          method: 'POST',
          body: JSON.stringify({ action: 'discard', path, side: 'unstaged' }),
        }),
      );
      assert.equal(response.status, 400, `expected ${path} to be refused`);
    }
  });

  await check('an action this view does not run is refused', async () => {
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'rebase-whatever' }),
      }),
    );
    assert.equal(response.status, 400);
  });

  await check('a commit without a message is refused before git runs', async () => {
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'commit', message: '   ' }),
      }),
    );
    assert.equal(response.status, 400);
  });

  await check('stage moves a file across, and unstage moves it back', async () => {
    writeFileSync(join(repo, 'app.ts'), 'const a = 1\nconst b = 20\n');
    await post({ action: 'stage', paths: ['app.ts'] });
    let status = (await call('/api/git.status', { sessionId: 's' })).body;
    assert.deepEqual(status.staged.map(f => f.path), ['app.ts']);
    assert.deepEqual(status.unstaged, []);

    await post({ action: 'unstage', paths: ['app.ts'] });
    status = (await call('/api/git.status', { sessionId: 's' })).body;
    assert.deepEqual(status.staged, []);
    assert.deepEqual(status.unstaged.map(f => f.path), ['app.ts']);
  });

  await check('discard restores the working tree from the index', async () => {
    await post({ action: 'stage', paths: ['app.ts'] });
    writeFileSync(join(repo, 'app.ts'), 'const a = 1\nconst b = 999\n');
    await post({ action: 'discard', path: 'app.ts', side: 'unstaged' });
    assert.equal(readFileSync(join(repo, 'app.ts'), 'utf8'), 'const a = 1\nconst b = 20\n');
  });

  await check('discard of an untracked file removes it', async () => {
    writeFileSync(join(repo, 'scratch.txt'), 'scratch\n');
    await post({ action: 'discard', path: 'scratch.txt', side: 'untracked' });
    assert.equal(existsSync(join(repo, 'scratch.txt')), false);
  });

  await check('commit records the staged change and empties the staged group', async () => {
    const before = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
    await post({ action: 'commit', message: 'set b to twenty' });
    const after = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
    assert.notEqual(before, after);
    assert.match(execFileSync('git', ['log', '-1', '--pretty=%s'], { cwd: repo, encoding: 'utf8' }).trim(), /set b to twenty/);
    const status = (await call('/api/git.status', { sessionId: 's' })).body;
    assert.deepEqual(status.staged, []);
  });

  await check('branches list the local branch and its commit', async () => {
    const { status, body } = await call('/api/git.branches', { sessionId: 's' });
    assert.equal(status, 200);
    assert.equal(body.current, 'main');
    assert.equal(body.detached, false);
    const main = body.branches.find(branch => branch.name === 'main');
    assert.equal(main.current, true);
    assert.match(main.sha, /^[0-9a-f]{7,}$/);
    assert.equal(main.subject, 'set b to twenty');
  });

  await check('a new branch is created and checked out', async () => {
    await post({ action: 'branch.create', name: 'feature/from-git-view' });
    const body = (await call('/api/git.branches', { sessionId: 's' })).body;
    assert.equal(body.current, 'feature/from-git-view');
    await post({ action: 'checkout', branch: 'main' });
    assert.equal((await call('/api/git.branches', { sessionId: 's' })).body.current, 'main');
  });

  await check('a branch name that is not a ref is refused', async () => {
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'checkout', branch: '--detach; rm -rf /' }),
      }),
    );
    assert.equal(response.status, 400);
  });

  await check('stash push, list, apply, and drop round-trip', async () => {
    const committed = readFileSync(join(repo, 'app.ts'), 'utf8');
    writeFileSync(join(repo, 'app.ts'), 'const a = 1\nconst b = 777\n');
    const stashed = readFileSync(join(repo, 'app.ts'), 'utf8');

    await post({ action: 'stash.push', message: 'wip from the git view' });
    // push takes the change back out, leaving the last commit behind.
    assert.equal(readFileSync(join(repo, 'app.ts'), 'utf8'), committed);

    const listed = (await call('/api/git.stashes', { sessionId: 's' })).body.stashes;
    assert.equal(listed[0].ref, 'stash@{0}');
    assert.equal(listed[0].message, 'wip from the git view');
    assert.equal(listed[0].files, 1);

    await post({ action: 'stash.apply', ref: 'stash@{0}' });
    assert.equal(readFileSync(join(repo, 'app.ts'), 'utf8'), stashed);
    assert.equal((await call('/api/git.stashes', { sessionId: 's' })).body.stashes.length, 1, 'apply keeps the stash');

    await post({ action: 'stash.drop', ref: 'stash@{0}' });
    assert.deepEqual((await call('/api/git.stashes', { sessionId: 's' })).body.stashes, []);
  });

  await check('a stash with no message and no options is still a stash', async () => {
    const before = (await call('/api/git.stashes', { sessionId: 's' })).body.stashes.length;
    writeFileSync(join(repo, 'app.ts'), 'const a = 1\nconst b = 31337\n');
    await post({ action: 'stash.push' });
    const after = (await call('/api/git.stashes', { sessionId: 's' })).body.stashes;
    assert.equal(after.length, before + 1);
    await post({ action: 'stash.clear' });
  });

  await check('a stash reference this view did not mint is refused', async () => {
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'stash.apply', ref: 'refs/heads/main' }),
      }),
    );
    assert.equal(response.status, 400);
  });

  await check('a failing action reports git\'s own message', async () => {
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'checkout', branch: 'no-such-branch' }),
      }),
    );
    assert.equal(response.status, 409);
    assert.match(await response.text(), /no-such-branch/);
  });

  // --- bulk actions, remote actions, and the model-backed commit message -----
  writeFileSync(join(repo, 'a.txt'), 'a1\n');
  writeFileSync(join(repo, 'b.txt'), 'b1\n');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: repo });
  writeFileSync(join(repo, 'a.txt'), 'a2\n');
  writeFileSync(join(repo, 'b.txt'), 'b2\n');

  await check('a group can be staged in one action', async () => {
    const status = (await call('/api/git.status', { sessionId: 's' })).body;
    await post({ action: 'stage', paths: status.unstaged.map(f => f.path) });
    const after = (await call('/api/git.status', { sessionId: 's' })).body;
    assert.deepEqual(after.unstaged, []);
    assert.deepEqual(after.staged.map(f => f.path).sort(), ['a.txt', 'b.txt']);
  });

  await check('a group can be unstaged in one action', async () => {
    const status = (await call('/api/git.status', { sessionId: 's' })).body;
    await post({ action: 'unstage', paths: status.staged.map(f => f.path) });
    const after = (await call('/api/git.status', { sessionId: 's' })).body;
    assert.deepEqual(after.staged, []);
    assert.deepEqual(after.unstaged.map(f => f.path).sort(), ['a.txt', 'b.txt']);
  });

  await check('a group of untracked files can be discarded in one action', async () => {
    writeFileSync(join(repo, 'u1.txt'), 'u\n');
    writeFileSync(join(repo, 'u2.txt'), 'u\n');
    await post({ action: 'discard', side: 'untracked', paths: ['u1.txt', 'u2.txt'] });
    assert.equal(existsSync(join(repo, 'u1.txt')), false);
    assert.equal(existsSync(join(repo, 'u2.txt')), false);
  });

  await check('a bulk path list that could leave the repository is refused whole', async () => {
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'stage', paths: ['a.txt', '../escape'] }),
      }),
    );
    assert.equal(response.status, 400);
  });

  await check('a commit message is written from the staged diff by the configured model', async () => {
    await post({ action: 'stage', paths: ['a.txt', 'b.txt'] });
    llmCalls.length = 0;
    const answer = await post({ action: 'generateMessage' });
    assert.equal(answer.message, 'feat(ui): add the git view');
    assert.equal(answer.model, 'test-model');
    assert.equal(llmCalls.length, 1);
    assert.equal(llmCalls[0].provider, 'test-provider');
    assert.equal(llmCalls[0].model, 'test-model');
    assert.equal(llmCalls[0].sessionId, 's');
    // The staged diff itself is what the model is shown.
    assert.match(llmCalls[0].messages[0].content[0].text, /a2/);
    assert.match(llmCalls[0].messages[0].content[0].text, /b2/);
  });

  await check('a fenced or quoted model reply is unwrapped before it reaches git', async () => {
    process.env.TEST_COMMIT_MESSAGE = '```\nfix: strip the fence\n```';
    try {
      const answer = await post({ action: 'generateMessage' });
      assert.equal(answer.message, 'fix: strip the fence');
    } finally {
      delete process.env.TEST_COMMIT_MESSAGE;
    }
  });

  await check('generating a message with nothing staged is refused before the model runs', async () => {
    execFileSync('git', ['reset', '-q', 'HEAD', '--', '.'], { cwd: repo });
    llmCalls.length = 0;
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'generateMessage' }),
      }),
    );
    assert.equal(response.status, 400);
    assert.equal(llmCalls.length, 0, 'the model must not run for an empty staged set');
  });

  await check('push without a remote reports git\'s own refusal', async () => {
    const route = routes.get('/api/git.action');
    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'push' }),
      }),
    );
    assert.equal(response.status, 409);
  });

  // --- writing and previewing ------------------------------------------------
  writeFileSync(join(repo, 'edit-me.txt'), 'first\n');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'seed edit'], { cwd: repo });
  writeFileSync(join(repo, 'edit-me.txt'), 'first\nsecond\n');

  const write = body => {
    const route = routes.get('/api/git.write');
    return route.fetch(
      new Request('http://127.0.0.1/api/git.write?sessionId=s', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  };

  await check('a working-tree file can be read back with the version a save is guarded by', async () => {
    const answer = (await call('/api/git.file', { sessionId: 's', path: 'edit-me.txt' })).body;
    assert.equal(answer.kind, 'text');
    assert.match(answer.text, /second/);
    assert.equal(typeof answer.version, 'string');
  });

  await check('saving replaces the working-tree file and returns its new version', async () => {
    const before = (await call('/api/git.file', { sessionId: 's', path: 'edit-me.txt' })).body;
    const response = await write({ path: 'edit-me.txt', text: 'first\nsecond\nthird\n', version: before.version });
    assert.equal(response.status, 200);
    const after = JSON.parse(await response.text());
    assert.equal(after.ok, true);
    assert.equal(readFileSync(join(repo, 'edit-me.txt'), 'utf8'), 'first\nsecond\nthird\n');
    // The save shows up as an unstaged change, which is what the view redraws.
    const status = (await call('/api/git.status', { sessionId: 's' })).body;
    assert.deepEqual(status.unstaged.map(f => f.path), ['edit-me.txt']);
  });

  await check('a save carrying a version that no longer matches is refused, file untouched', async () => {
    const before = (await call('/api/git.file', { sessionId: 's', path: 'edit-me.txt' })).body;
    // A second writer lands first.
    const first = await write({ path: 'edit-me.txt', text: 'first writer wins\n', version: before.version });
    assert.equal(first.status, 200);
    // The stale writer now tries with the version it read before that.
    const stale = await write({ path: 'edit-me.txt', text: 'second writer loses\n', version: before.version });
    assert.equal(stale.status, 409);
    assert.match(await stale.text(), /changed since it was opened/);
    assert.equal(readFileSync(join(repo, 'edit-me.txt'), 'utf8'), 'first writer wins\n');
  });

  await check('a write without a version still writes', async () => {
    const response = await write({ path: 'edit-me.txt', text: 'no guard\n' });
    assert.equal(response.status, 200);
    assert.equal(readFileSync(join(repo, 'edit-me.txt'), 'utf8'), 'no guard\n');
  });

  await check('a path that could leave the repository is refused by the write route', async () => {
    for (const path of ['../escape.txt', 'a/../../b', 'C:/Windows/system32', '--upload-pack=touch', '']) {
      const response = await write({ path, text: 'x' });
      assert.equal(response.status, 400, `expected ${path} to be refused`);
    }
  });

  await check('a write without text is refused before anything is written', async () => {
    const response = await write({ path: 'edit-me.txt' });
    assert.equal(response.status, 400);
    assert.equal(readFileSync(join(repo, 'edit-me.txt'), 'utf8'), 'no guard\n');
  });

  await check('writing a file that is not there is a 404, not a 500', async () => {
    const response = await write({ path: 'not-here.txt', text: 'x' });
    assert.equal(response.status, 404);
  });

  await check('writing a directory is refused', async () => {
    mkdirSync(join(repo, 'adir'), { recursive: true });
    const response = await write({ path: 'adir', text: 'x' });
    assert.equal(response.status, 404);
  });

  await check('the write route refuses anything but POST', async () => {
    const route = routes.get('/api/git.write');
    const response = await route.fetch(new Request('http://127.0.0.1/api/git.write?sessionId=s'));
    assert.equal(response.status, 405);
  });

  await check('a picture is served as a data URL without ever being read as text', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    writeFileSync(join(repo, 'dot.png'), png);
    let readAsText = 0;
    const guarded = { ...fs, readText: async target => { readAsText += 1; return fs.readText(target); } };
    const route = routes.get('/api/git.file');    const response = await route.fetch(
      new Request('http://127.0.0.1/api/git.file?sessionId=s&path=dot.png&side=worktree'),
    );
    // The answer must stand on its own: the picture is not valid UTF-8, so a
    // route that read it as text first would have 404'd by now.
    assert.equal(response.status, 200);
    const answer = JSON.parse(await response.text());
    assert.equal(answer.kind, 'inline');
    assert.match(answer.dataUrl, /^data:image\/png;base64,/);
    assert.equal(Buffer.from(answer.dataUrl.split(',')[1], 'base64').equals(png), true);
    assert.equal(readAsText, 0, 'the picture must not be decoded as text');
    assert.equal(fs.readText, undefined, 'the Host must not need a text reader at all');
    assert.ok(guarded);
  });

  await check('an svg is served as source, never as an inline document', async () => {
    writeFileSync(join(repo, 'x.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const answer = (await call('/api/git.file', { sessionId: 's', path: 'x.svg' })).body;
    assert.equal(answer.kind, 'text');
    assert.match(answer.text, /<svg/);
  });

  await check('a pdf is served as a data URL the browser can embed', async () => {
    writeFileSync(join(repo, 'doc.pdf'), Buffer.from('%PDF-1.4\n%%EOF\n', 'utf8'));
    const answer = (await call('/api/git.file', { sessionId: 's', path: 'doc.pdf' })).body;
    assert.equal(answer.kind, 'inline');
    assert.match(answer.dataUrl, /^data:application\/pdf;base64,/);
  });

  await check('a file whose bytes are not UTF-8 is refused as text, not served as source', async () => {
    writeFileSync(join(repo, 'blob.dat'), Buffer.from([0xff, 0xfe, 0x00, 0x41, 0x80, 0x42]));
    const answer = (await call('/api/git.file', { sessionId: 's', path: 'blob.dat' })).body;
    assert.equal(answer.kind, 'binary');
    assert.equal(answer.text, undefined);
  });

  await check('a pathspec failure is explained, not just repeated', async () => {
    // The row still says this file is staged; it is not. That is not a failure
    // to report in git's own words, because nobody asked what git thinks.
    const response = await routes.get('/api/git.action').fetch(
      new Request('http://127.0.0.1/api/git.action?sessionId=s', {
        method: 'POST',
        body: JSON.stringify({ action: 'unstage', paths: ['never-staged.txt'] }),
      }),
    );
    assert.equal(response.status, 409);
    const body = JSON.parse(await response.text());
    assert.match(body.message, /no longer in the state/i);
    assert.match(body.detail, /did not match any files/i);
  });

await check('a staged picture previews like any other', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    writeFileSync(join(repo, 'staged.png'), png);
    await post({ action: 'stage', paths: ['staged.png'] });
    const answer = (await call('/api/git.file', { sessionId: 's', path: 'staged.png', side: 'staged' })).body;
    // Every file the user has just staged is index-side, so refusing this would
    // leave the file view unusable for the most common thing anyone does here.
    assert.equal(answer.kind, 'inline');
    assert.match(answer.dataUrl, /^data:image\/png;base64,/);
    assert.equal(Buffer.from(answer.dataUrl.split(',')[1], 'base64').equals(png), true);
  });

  await check('a staged picture whose working-tree copy moved is not served from that copy', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    writeFileSync(join(repo, 'moved.png'), png);
    await post({ action: 'stage', paths: ['moved.png'] });
    writeFileSync(join(repo, 'moved.png'), Buffer.concat([png, Buffer.from([0x00, 0x01])]));
    const answer = (await call('/api/git.file', { sessionId: 's', path: 'moved.png', side: 'staged' })).body;
    // The bytes on disk are no longer the bytes on this side. Handing them over
    // would show a picture that was never staged, which is worse than a refusal.
    assert.equal(answer.kind, 'binary');
    assert.equal(answer.dataUrl, undefined);
  });

  await check('a message the model could not finish is reported as truncated', async () => {
    // The backend reports `max-tokens`; the text still arrives looking complete,
    // so the route has to say so rather than let half a sentence pass as done.
    const original = llm.stream;
    llm.stream = async function* stream(options) {
      yield* original.call(this, options);
      yield { type: 'finish', reason: { kind: 'max-tokens' } };
    };
    try {
      // Earlier checks committed everything away; there must be something staged
      // before there is anything to describe.
      writeFileSync(join(repo, 'edit-me.txt'), 'something to describe\n');
      await post({ action: 'stage', paths: ['edit-me.txt'] });
      const answer = await post({ action: 'generateMessage' });
      assert.equal(answer.truncated, true);
      assert.ok(answer.message.length > 0, 'the partial text is still returned');
    } finally {
      llm.stream = original;
    }
  });

  await check('a finished message is not flagged as truncated', async () => {
    const answer = await post({ action: 'generateMessage' });
    assert.equal(answer.truncated, undefined);
  });

  await check('the status says whether the repository has a remote at all', async () => {
    assert.equal((await call('/api/git.status', { sessionId: 's' })).body.repo.hasRemote, false);
    execFileSync('git', ['remote', 'add', 'origin', 'https://example.invalid/x.git'], { cwd: repo });
    try {
      assert.equal((await call('/api/git.status', { sessionId: 's' })).body.repo.hasRemote, true);
    } finally {
      execFileSync('git', ['remote', 'remove', 'origin'], { cwd: repo });
    }
  });

  await check('the status names the commits a push would publish', async () => {
    // The push confirmation has to say what is leaving the machine, so the
    // status has to carry the subjects, not only the count porcelain reports.
    assert.deepEqual((await call('/api/git.status', { sessionId: 's' })).body.repo.outgoing, []);

    // The bare remote lives outside the working repository: inside it, git would
    // report the remote itself as untracked content and every count in this file
    // would be off by one.
    const remote = mkdtempSync(join(tmpdir(), 'dsh-git-view-remote-'));
    const bare = join(remote, 'origin.git');
    execFileSync('git', ['init', '-q', '--bare', bare]);
    execFileSync('git', ['remote', 'add', 'origin', bare], { cwd: repo });
    execFileSync('git', ['push', '-q', '-u', 'origin', 'HEAD'], { cwd: repo });
    try {
      writeFileSync(join(repo, 'shipped.txt'), 'one\n');
      execFileSync('git', ['add', 'shipped.txt'], { cwd: repo });
      execFileSync('git', ['commit', '-qm', 'first thing'], { cwd: repo });
      writeFileSync(join(repo, 'shipped.txt'), 'one\ntwo\n');
      execFileSync('git', ['add', 'shipped.txt'], { cwd: repo });
      execFileSync('git', ['commit', '-qm', 'second thing'], { cwd: repo });

      const { body } = await call('/api/git.status', { sessionId: 's' });
      assert.equal(body.repo.ahead, 2, 'two commits are ahead');
      assert.deepEqual(
        body.repo.outgoing.map(c => c.subject),
        ['second thing', 'first thing'],
        'newest first, matching what git log reports',
      );
      for (const commit of body.repo.outgoing) {
        assert.match(commit.sha, /^[0-9a-f]{7,}$/, 'each commit is addressable by its short sha');
      }
      // Already published, so nothing is left to push and the list is empty —
      // which is what the "nothing ahead" line in the dialog is for.
      execFileSync('git', ['push', '-q'], { cwd: repo });
      assert.deepEqual((await call('/api/git.status', { sessionId: 's' })).body.repo.outgoing, []);
    } finally {
      execFileSync('git', ['reset', '-q', '--hard', 'HEAD~2'], { cwd: repo });
      execFileSync('git', ['remote', 'remove', 'origin'], { cwd: repo });
      rmSync(remote, { recursive: true, force: true });
    }
  });

  await check('a capped list reports the count it did not list', async () => {
    // The files go in the repository root, not in a folder: an untracked
    // *directory* is now one entry rather than one entry per file, which is the
    // whole reason the status scan no longer says `--untracked-files=all`.
    const before = (await call('/api/git.status', { sessionId: 's' })).body.counts.untracked.total;
    const written = [];
    try {
      for (let i = 0; i < 505; i += 1) {
        const name = `flood-${i}.txt`;
        written.push(name);
        writeFileSync(join(repo, name), `${i}\n`);
      }
      const status = (await call('/api/git.status', { sessionId: 's' })).body;
      assert.equal(status.untracked.length, 500);
      assert.equal(status.counts.untracked.listed, 500);
      // The fixture repo already holds untracked files of its own, so the claim
      // is about the delta and not about 505 being the whole repository.
      assert.equal(status.counts.untracked.total, before + 505);
      assert.equal(status.truncated, true);
      // A group that was not capped must still be exact.
      assert.equal(status.counts.staged.total, status.staged.length);
    } finally {
      for (const name of written) rmSync(join(repo, name), { force: true });
    }
  });

  await check('an untracked directory is one entry, and opening it is scoped', async () => {
    mkdirSync(join(repo, 'bundle', 'deep'), { recursive: true });
    for (let i = 0; i < 300; i += 1) writeFileSync(join(repo, 'bundle', `b${i}.txt`), `${i}\n`);
    writeFileSync(join(repo, 'bundle', 'deep', 'd.txt'), 'x\n');
    try {
      const status = (await call('/api/git.status', { sessionId: 's' })).body;
      const rows = status.untracked.filter(file => file.path.startsWith('bundle'));
      // Three hundred files, one row — and the row says it is a directory, so
      // the tree knows it has to go and ask rather than folding to nothing.
      assert.deepEqual(rows.map(file => file.path), ['bundle/']);
      assert.equal(rows[0].dir, true);

      const opened = (await call('/api/git.untracked', { sessionId: 's', dir: 'bundle/' })).body;
      assert.equal(opened.total, 301);
      assert.equal(opened.truncated, false);
      assert.ok(opened.files.some(file => file.path === 'bundle/b0.txt'));
      assert.ok(opened.files.some(file => file.path === 'bundle/deep/d.txt'));
    } finally {
      rmSync(join(repo, 'bundle'), { recursive: true, force: true });
    }
  });

  await check('opening a directory is refused unless the caller names a directory', async () => {
    // Without this, a bare filename would answer with a scan of the whole
    // repository — the cost this route exists to avoid.
    const bare = await call('/api/git.untracked', { sessionId: 's', dir: 'README.md' });
    assert.equal(bare.status, 400);
    const escape = await call('/api/git.untracked', { sessionId: 's', dir: '../elsewhere/' });
    assert.equal(escape.status, 400);
  });

  // Every check below works on one shared set of nested repositories, created
  // once and removed at the end, because creating a repository is the slow part.
  const near = nestedRepo('app-near');
  const far = nestedRepo('group/deep/app-far');
  const ignored = nestedRepo('node_modules/vendored');

  try {
    await check('repositories one level down are discovered, deeper ones are not', async () => {
      const { status, body } = await call('/api/git.repositories', { sessionId: 's', fresh: '1' });
      assert.equal(status, 200);
      const paths = body.projects.map(entry => entry.path);
      assert.ok(paths.includes(resolvePath(repo)), 'the enclosing repository is offered');
      assert.ok(paths.includes(near), 'a repository one level down is offered');
      assert.ok(!paths.includes(far), 'a repository two levels down is not offered');
      for (const entry of body.projects) assert.ok(typeof entry.name === 'string' && entry.name.length > 0);
    });

    await check('the project list costs no git, so it can carry no state', async () => {
      // This is the property that keeps the panel off the critical path: listing
      // repositories costs one walk, summarising them costs a status call each.
      const { body } = await call('/api/git.repositories', { sessionId: 's', fresh: '1' });
      assert.equal(body.summaries, undefined, 'the list reports names, not status');
      for (const entry of body.projects) assert.equal(entry.staged, undefined);
    });

    await check('node_modules is skipped even when it holds a repository', async () => {
      const { body } = await call('/api/git.repositories', { sessionId: 's', fresh: '1' });
      assert.ok(!body.projects.some(entry => entry.path === ignored), 'a vendored repository is not offered');
    });

    await check('a refresh rescans the workspace, a plain read does not', async () => {
      // Walking a wide workspace costs a listing plus one lstat per child, which
      // measured 2.6 s here. So the list is reused until a refresh asks for what
      // is there now — which is how a repository created since the last scan
      // becomes visible without every poll paying for the walk again.
      await call('/api/git.repositories', { sessionId: 's', fresh: '1' });
      const late = nestedRepo('app-late');
      try {
        const plain = await call('/api/git.repositories', { sessionId: 's' });
        assert.ok(!plain.body.projects.some(entry => entry.path === late), 'a plain read reuses the last scan');
        const refreshed = await call('/api/git.repositories', { sessionId: 's', fresh: '1' });
        assert.ok(refreshed.body.projects.some(entry => entry.path === late), 'a refresh finds it');
      } finally {
        rmSync(late, { recursive: true, force: true });
      }
    });

    await check('a clean repository is still listed, and its summary says it is clean', async () => {
      const { body } = await call('/api/git.summaries', { sessionId: 's' });
      const entry = body.summaries.find(item => item.path === near);
      assert.ok(entry, 'the clean repository is summarised');
      assert.equal(entry.branch, 'main');
      assert.equal(entry.clean, true);
      assert.equal(entry.staged, 0);
    });

    await check('a repository with staged work is marked as having something to commit', async () => {
      // Staged through the route rather than behind its back: a change made
      // outside the panel is exactly what the cache TTL is for, and this case is
      // about the marker, not about the TTL.
      writeFileSync(join(near, 'pending.txt'), 'ready to commit\n');
      await postIn(near, { action: 'stage', paths: ['pending.txt'] });
      const { body } = await call('/api/git.summaries', { sessionId: 's' });
      const entry = body.summaries.find(item => item.path === near);
      assert.equal(entry.clean, false);
      assert.equal(entry.staged, 1, 'the staged file is counted');
    });

    await check('a repository that cannot answer costs only its own summary', async () => {
      // The batch shares a deadline. An unreadable candidate must be reported by
      // name rather than taking the whole answer down with it.
      const { status, body } = await call('/api/git.summaries', { sessionId: 's' });
      assert.equal(status, 200);
      assert.ok(body.summaries.length > 0, 'the readable repositories still answer');
      assert.ok(Array.isArray(body.unknown), 'and the unreadable ones are named');
    });

    await check('asking twice costs one set of status calls', async () => {
      // The panel asks again every time someone picks a different project, and
      // on a wide working directory that is seconds of repeated work. Only the
      // repositories that failed to answer may be asked again: remembering a
      // timeout would keep the repository it belongs to silent for good.
      const first = await call('/api/git.summaries', { sessionId: 's' });
      const asked = new Set(scannedDirs().slice(-(first.body.summaries.length + first.body.unknown.length)));
      const before = scannedDirs().length;
      const { body } = await call('/api/git.summaries', { sessionId: 's' });
      const again = scannedDirs().slice(before);
      for (const cwd of again) {
        assert.ok(first.body.unknown.includes(cwd), `${cwd} answered the first time and was asked again`);
      }
      assert.equal(body.cached, first.body.summaries.length, 'every repository that answered is served from cache');
      assert.ok(asked.size > 0, 'the first answer really did run status');
    });

    await check('staging something drops that repository from the cache', async () => {
      // A cached marker that outlives the change it describes is the one way
      // caching here can tell a lie.
      await call('/api/git.summaries', { sessionId: 's' });
      const before = scannedDirs().length;
      writeFileSync(join(near, 'fresh.txt'), 'just written\n');
      await postIn(near, { action: 'stage', paths: ['fresh.txt'] });
      const { body } = await call('/api/git.summaries', { sessionId: 's' });
      assert.ok(scannedDirs().slice(before).includes(near), 'the repository that changed is asked again');
      const entry = body.summaries.find(item => item.path === near);
      assert.ok(entry.staged >= 1, 'and its answer reflects the change');
    });

    await check('naming a discovered repository switches which one is served', async () => {
      const switched = await call('/api/git.status', { sessionId: 's', repo: near });
      assert.equal(switched.status, 200);
      assert.equal(switched.body.repo.root, near);
      // The nested repository has its own staged change and no trace of the
      // enclosing one, which is what makes it a separate project rather than a
      // view onto the same files.
      assert.ok(switched.body.staged.some(file => file.path === 'pending.txt'));
      const enclosing = await call('/api/git.status', { sessionId: 's' });
      assert.notEqual(enclosing.body.repo.root, near, 'omitting repo keeps the enclosing one');
    });

    await check('a repository the scan never offered is refused', async () => {
      // The allowlist is the whole boundary: without it, any path the browser
      // could name would be a repository this session may read.
      const outside = await call('/api/git.status', { sessionId: 's', repo: tmpdir() });
      assert.equal(outside.status, 200);
      assert.equal(outside.body.repo.root, resolvePath(repo), 'an unknown repo falls back rather than being served');

      const traversal = await call('/api/git.status', { sessionId: 's', repo: `${repo}/app-near/../..` });
      assert.equal(traversal.body.repo.root, resolvePath(repo), 'a path spelled with .. cannot select another repository');
    });
  } finally {
    rmSync(join(repo, 'app-near'), { recursive: true, force: true });
    rmSync(join(repo, 'group'), { recursive: true, force: true });
    rmSync(join(repo, 'node_modules'), { recursive: true, force: true });
  }
} finally {
  rmSync(repo, { recursive: true, force: true });
}

process.stdout.write(failures === 0 ? '\nall route checks passed\n' : `\n${failures} route check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);