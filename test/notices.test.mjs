/**
 * Checks on what the panel says while an action runs and after it lands.
 *
 * A push is the one action that leaves no trace anywhere in the view: the
 * commits stop being ahead, which looks exactly like never having pushed. So
 * the line beside the button is the entire record that it happened, and these
 * cases pin down when it appears, what it says, and that it does not linger.
 *
 * `useActions` is a hook, so unlike the project layer it cannot be executed and
 * walked — it is run against a minimal hooks runtime that re-renders on state
 * changes and flushes effects, which is enough to exercise the sequencing and
 * the timers that are the whole point here.
 *
 * Run with: node test/notices.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ESBUILD = [
  join(root, 'node_modules', 'esbuild', 'bin', 'esbuild'),
  process.env.APPDATA ? join(process.env.APPDATA, 'npm', 'node_modules', 'esbuild', 'bin', 'esbuild') : '',
].find(path => path !== '' && existsSync(path));
assert.ok(ESBUILD, 'esbuild not found; install it with: npm install -g esbuild');

// --- compile with `postAction` replaced by one this test controls -------------
// The hook's whole job is what it does with the answer, so the network is the
// one thing here that must not be real. `postAction` is bundled rather than
// imported, so it is swapped through a resolver rather than a module stub.
const out = mkdtempSync(join(tmpdir(), 'dsh-git-view-notices-'));
const bundle = join(out, 'actions.cjs');
const esbuild = await import(
  process.env.APPDATA
    ? `file:///${join(process.env.APPDATA, 'npm', 'node_modules', 'esbuild', 'lib', 'main.js').replace(/\\/g, '/')}`
    : 'esbuild'
);

await esbuild.build({
  entryPoints: [join(root, 'src', 'actions.jsx')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  outfile: bundle,
  external: ['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'],
  logLevel: 'silent',
  plugins: [
    {
      name: 'stub-the-network',
      setup(build) {
        build.onResolve({ filter: /(^|\/)api\.js$/ }, () => ({ path: 'stub-api', namespace: 'stub' }));
        build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
          contents: 'exports.postAction = (...args) => globalThis.__postAction(...args);',
          loader: 'js',
        }));
      },
    },
  ],
});

// --- the smallest React that runs a hook for real -----------------------------
// State is held, effects run after the render like the platform's do, and a
// setter schedules another render. That is all `useActions` needs; the parts
// left out (keys, memoisation, transitions) cannot change its behaviour here.
const hooks = { values: [], deps: [], cleanups: [], pending: new Set(), effects: new Map(), queued: false };

let index = 0;
let renderBody;
function render() {
  // The hook cursor restarts every render: it identifies which call site a
  // value belongs to, so leaving it running would give the second render a
  // fresh set of slots and read back nothing that was just written.
  index = 0;
  for (const cleanup of hooks.cleanups.splice(0)) cleanup();
  renderBody();
  for (const i of [...hooks.pending]) {
    hooks.pending.delete(i);
    const cleanup = hooks.effects.get(i)();
    if (typeof cleanup === 'function') hooks.cleanups.push(cleanup);
  }
}
function schedule() {
  if (hooks.queued) return;
  hooks.queued = true;
  queueMicrotask(() => {
    hooks.queued = false;
    render();
  });
}

const react = {
  useState(initial) {
    const i = index++;
    if (!(i in hooks.values)) hooks.values[i] = typeof initial === 'function' ? initial() : initial;
    return [
      hooks.values[i],
      next => {
        hooks.values[i] = typeof next === 'function' ? next(hooks.values[i]) : next;
        schedule();
      },
    ];
  },
  useCallback(fn) {
    index += 1;
    return fn;
  },
  useEffect(fn, deps) {
    const i = index++;
    const previous = hooks.deps[i];
    const changed = previous === undefined || deps === undefined || deps.some((value, k) => !Object.is(value, previous[k]));
    if (changed) {
      hooks.deps[i] = deps;
      hooks.effects.set(i, fn);
      hooks.pending.add(i);
    }
  },
};
const jsx = (type, props) => ({ type, props });

const require_ = name => {
  if (name === 'react') return react;
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: Symbol('Fragment') };
  if (name === '@deepseek-ai/dsh-client-ui-primitives') {
    return { Menu: () => null, Modal: () => null, RiskConfirmation: () => null };
  }
  throw new Error(`unexpected require: ${name}`);
};
const compiled = new Function('require', 'module', 'exports', readFileSync(bundle, 'utf8'));
const module_ = { exports: {} };
compiled(require_, module_, module_.exports);
const { useActions } = module_.exports;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Run the hook and hand back its latest value. */
function mountHook() {
  let latest;
  renderBody = () => {
    latest = useActions('session', async () => {}, 'D:/repo');
  };
  render();
  return () => latest;
}

let failures = 0;
const check = async (name, fn) => {
  try {
    await fn();
    process.stdout.write(`  ok  ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stdout.write(`  FAIL  ${name} — ${error.message}\n`);
  }
};

await check('a completed push says so', async () => {
  const read = mountHook();
  globalThis.__postAction = async () => ({ ok: true });
  await read().run({ action: 'push' }, { done: 'Pushed to origin/main' });
  assert.equal(read().done, 'Pushed to origin/main');
  assert.equal(read().problem, undefined);
});

await check('a refused push reports the refusal and claims no success', async () => {
  const read = mountHook();
  globalThis.__postAction = async () => {
    throw new Error('remote: rejected');
  };
  await read().run({ action: 'push' }, { done: 'Pushed to origin/main' });
  assert.equal(read().problem, 'remote: rejected');
  assert.equal(read().done, undefined, 'nothing succeeded, so nothing says it did');
});

await check('starting the next action clears the last result', async () => {
  // Otherwise the line beside the button reports an action that has been
  // replaced by a newer one, and reads as the result of the newer one.
  const read = mountHook();
  globalThis.__postAction = async () => ({ ok: true });
  await read().run({ action: 'push' }, { done: 'Pushed to origin/main' });
  assert.equal(read().done, 'Pushed to origin/main');
  const pending = read().run({ action: 'push' }, { done: 'Pushed to origin/main' });
  // A state write re-renders on the next microtask here, the way a batched
  // update lands before the browser paints.
  await Promise.resolve();
  assert.equal(read().done, undefined, 'cleared as soon as the new one starts');
  await pending;
});

await check('an action that finishes quickly never says it is running', async () => {
  // Checked while the action is still in flight, not afterwards: the flag is
  // cleared in the same `finally` that ends it, so reading it once the promise
  // has settled says nothing about whether it was ever shown.
  const read = mountHook();
  let release;
  globalThis.__postAction = () => new Promise(resolve => { release = () => resolve({ ok: true }); });
  const pending = read().run({ action: 'stage', paths: ['a.txt'] });
  await sleep(150);
  assert.equal(read().working, undefined, 'still inside the delay, so nothing is claimed');
  assert.equal(read().busy, true, 'though it is running');
  release();
  await pending;
});

await check('an action that takes a while says it is running', async () => {
  // The case this exists for: a slow remote, where a disabled button is
  // otherwise indistinguishable from a button that did nothing.
  const read = mountHook();
  let release;
  globalThis.__postAction = () => new Promise(resolve => { release = () => resolve({ ok: true }); });
  const pending = read().run({ action: 'push' }, { working: 'Pushing to origin/main…' });
  await sleep(500);
  assert.equal(read().working, 'Pushing to origin/main…');
  release();
  await pending;
  assert.equal(read().working, undefined, 'and stops saying it once it is done');
});

await check('a finished result clears itself', async () => {
  const read = mountHook();
  globalThis.__postAction = async () => ({ ok: true });
  await read().run({ action: 'push' }, { done: 'Pushed to origin/main' });
  assert.equal(read().done, 'Pushed to origin/main');
  await sleep(6400);
  assert.equal(read().done, undefined, 'it names the last thing that happened, so it expires');
});

rmSync(out, { recursive: true, force: true });
process.stdout.write(failures === 0 ? '\nall notice checks passed\n' : `\n${failures} notice check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
