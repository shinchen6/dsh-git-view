/**
 * Checks on the project layer's output.
 *
 * `ProjectLayer` uses no hooks, so it is executed here directly and its element
 * tree walked, rather than mounted: the reconciliation itself is the platform's
 * and is not what these cases are about. What they pin down is the decision the
 * layer makes — which projects appear, what each one says, and that a row can
 * only ever select, never stage.
 *
 * Run with: node test/projects.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The esbuild launcher, the same way the build finds it. */
const ESBUILD = [
  join(root, 'node_modules', 'esbuild', 'bin', 'esbuild'),
  process.env.APPDATA ? join(process.env.APPDATA, 'npm', 'node_modules', 'esbuild', 'bin', 'esbuild') : '',
].find(path => path !== '' && existsSync(path));
assert.ok(ESBUILD, 'esbuild not found; install it with: npm install -g esbuild');

// --- compile the component so this test exercises the real source -------------
const out = mkdtempSync(join(tmpdir(), 'dsh-git-view-projects-'));
const bundle = join(out, 'projects.cjs');

// The launcher is a JavaScript file with no extension, so it is handed to node
// rather than spawned directly, which Windows reports as ENOENT.
execFileSync(process.execPath, [
  ESBUILD,
  join(root, 'src', 'projects.jsx'),
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--loader:.jsx=jsx',
  '--jsx=automatic',
  '--external:react',
  '--external:react/jsx-runtime',
  `--outfile=${bundle}`,
], { stdio: ['ignore', 'ignore', 'inherit'] });

// --- the smallest React that can run this component --------------------------
const react = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
const jsx = (type, props) => ({ type, props });

function createRequire() {
  return name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') {
      return { jsx, jsxs: jsx, Fragment: Symbol('Fragment') };
    }
    throw new Error(`unexpected require: ${name}`);
  };
}

const require_ = createRequire();
const compiled = new Function('require', 'module', 'exports', readFileSync(bundle, 'utf8'));
const module_ = { exports: {} };
compiled(require_, module_, module_.exports);
const { ProjectLayer } = module_.exports;

/**
 * Every element in a rendered tree, flattened.
 * @param {any} node - an element, or an array of them.
 * @returns {any[]} the elements.
 */
function flatten(node) {
  if (node === null || node === undefined || node === false) return [];
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (typeof node === 'object' && node.props !== undefined) {
    return [node, ...flatten(node.props.children)];
  }
  return [];
}

/**
 * Render the layer and return it as one flat list of elements.
 * @param {object} props - the layer's props.
 * @returns {any[]} the rendered elements.
 */
function render(props) {
  return flatten(ProjectLayer(props));
}

/** A project summary, with only what the layer reads. */
const project = (over = {}) => ({
  path: 'D:/w/app',
  name: 'app',
  branch: 'main',
  unborn: false,
  detached: false,
  staged: 0,
  unstaged: 0,
  conflicts: 0,
  untracked: 0,
  clean: true,
  ...over,
});

/** The text of every element carrying text, joined — what the row would read as. */
function textOf(props) {
  const walk = node => {
    if (node === null || node === undefined || node === false) return '';
    if (Array.isArray(node)) return node.map(walk).join('');
    if (typeof node === 'object' && node.props !== undefined) return walk(node.props.children);
    return String(node);
  };
  return walk(props.children);
}

let failures = 0;
/**
 * Assert one case and report it.
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
  check('a single project needs no layer', () => {
    assert.equal(ProjectLayer({ projects: [project()], current: 'D:/w/app', onSelect: () => {} }), null);
  });

  check('an unknown project list renders nothing rather than a broken row', () => {
    assert.equal(ProjectLayer({ projects: undefined, current: undefined, onSelect: () => {} }), null);
  });

  check('every project is listed, including the ones with nothing to do', () => {
    const rows = render({
      projects: [project(), project({ path: 'D:/w/api', name: 'api', clean: true }), project({ path: 'D:/w/web', name: 'web', clean: false, untracked: 3 })],
      current: 'D:/w/app',
      onSelect: () => {},
    }).filter(node => node.type === 'button');
    assert.equal(rows.length, 3, 'a quiet project is listed, not dropped');
    assert.ok(textOf(rows[1].props).includes('projects.clean'), 'and is marked as clean');
    assert.ok(textOf(rows[2].props).includes('projects.untrackedCount'), 'and one with work says what is waiting');
  });

  check('the current project is the marked one', () => {
    const rows = render({
      projects: [project({ path: 'D:/w/a', name: 'a' }), project({ path: 'D:/w/b', name: 'b' })],
      current: 'D:/w/b',
      onSelect: () => {},
    }).filter(node => node.type === 'button');
    assert.notEqual(rows[0].props.className.includes('current'), true);
    assert.equal(rows[1].props.className.includes('current'), true);
    assert.equal(rows[1].props['aria-current'], true);
  });

  check('a repository with no commits is named, not shown as HEAD', () => {
    // git reports the literal string "HEAD" as the branch of a repository with
    // no commits; rendering that raw looks like a broken branch rather than an
    // empty one.
    const row = render({
      projects: [project(), project({ path: 'D:/w/new', name: 'new', unborn: true, branch: 'HEAD' })],
      current: 'D:/w/app',
      onSelect: () => {},
    }).filter(node => node.type === 'button')[1];
    assert.ok(textOf(row.props).includes('projects.noCommits'));
    assert.ok(!textOf(row.props).includes('HEAD'), 'the literal HEAD never reaches the row');
  });

  check('a detached head says so rather than showing nothing', () => {
    const row = render({
      projects: [project(), project({ path: 'D:/w/d', name: 'd', detached: true, branch: null })],
      current: 'D:/w/app',
      onSelect: () => {},
    }).filter(node => node.type === 'button')[1];
    assert.ok(textOf(row.props).includes('projects.detached'));
  });

  check('staged work is reported as ready, ahead of unstaged', () => {
    const row = render({
      projects: [project(), project({ path: 'D:/w/m', name: 'm', clean: false, staged: 3, unstaged: 9 })],
      current: 'D:/w/app',
      onSelect: () => {},
    }).filter(node => node.type === 'button')[1];
    const text = textOf(row.props);
    assert.ok(text.includes('projects.stagedCount'), 'the committable count leads');
    assert.ok(!text.includes('projects.unstagedCount'), 'so a commit button beside it is not a lie');
  });

  check('a conflict outranks every other count', () => {
    const row = render({
      projects: [project(), project({ path: 'D:/w/c', name: 'c', clean: false, staged: 1, conflicts: 2 })],
      current: 'D:/w/app',
      onSelect: () => {},
    }).filter(node => node.type === 'button')[1];
    assert.ok(textOf(row.props).includes('projects.stagedCount'));
    assert.ok(row.props.className !== undefined);
  });

  check('a project row selects and never stages', () => {
    // The rows below stage what they name. A box up here would read as
    // permission to stage across repositories, which no commit ever does.
    let chosen;
    const rows = render({
      projects: [project(), project({ path: 'D:/w/api', name: 'api' })],
      current: 'D:/w/app',
      onSelect: path => { chosen = path; },
    }).filter(node => node.type === 'button');
    for (const row of rows) {
      assert.equal(row.props.type, 'button');
      const markup = JSON.stringify(row.props, (key, value) => (typeof value === 'function' ? '[fn]' : value));
      assert.ok(!markup.includes('input'), 'a project row renders no input');
      assert.ok(!markup.includes('checkbox'), 'and no checkbox');
      assert.ok(!markup.includes('onCheck'), 'and nothing that stages');
    }
    rows[1].props.onClick();
    assert.equal(chosen, 'D:/w/api', 'clicking a row makes that project current');
  });

  check('the state dot distinguishes ready from merely changed', () => {
    /** The dot belonging to the second row of a two-project layer. */
    const dotIn = second => {
      const row = render({
        projects: [project(), second],
        current: 'D:/w/app',
        onSelect: () => {},
      }).filter(node => node.type === 'button')[1];
      return flatten(row).find(node => node.props?.className?.startsWith('gv-project-dot'));
    };
    const ready = dotIn(project({ path: 'D:/w/r', name: 'r', clean: false, staged: 1 }));
    assert.ok(ready.props.className.endsWith('ready'), 'staged work is marked committable');
    const changed = dotIn(project({ path: 'D:/w/u', name: 'u', clean: false, unstaged: 4 }));
    assert.ok(!changed.props.className.endsWith('ready'), 'working-tree-only work is not');
    const quiet = dotIn(project({ path: 'D:/w/c', name: 'c' }));
    assert.ok(quiet.props.className.endsWith('clean'), 'a quiet project says so');
  });
} finally {
  rmSync(out, { recursive: true, force: true });
}

process.stdout.write(failures === 0 ? '\nall project checks passed\n' : `\n${failures} project check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);