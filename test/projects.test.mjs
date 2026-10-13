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
// `useState` is controllable rather than stateful: the component is executed
// directly rather than mounted, so the fold is tested by asking for the state
// the fold is in, not by simulating the click that changes it.
let useStateValue;
const react = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  useState: initial => [
    useStateValue === undefined ? (typeof initial === 'function' ? initial() : initial) : useStateValue,
    () => {},
  ],
};
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
  if (typeof node !== 'object' || node.props === undefined) return [];
  // A component written as a function is expanded rather than returned: the
  // tree is walked by executing it, not by mounting, so anything that is not a
  // host element has to be called to see what it draws.
  if (typeof node.type === 'function') return flatten(node.type(node.props));
  return [node, ...flatten(node.props.children)];
}

/**
 * Render the layer and return it as one flat list of elements.
 * @param {object} props - the layer's props.
 * @returns {any[]} the rendered elements.
 */
function render(props) {
  return flatten(ProjectLayer(props));
}

/**
 * The project rows in a render, in the order drawn.
 *
 * Rows are looked up by name rather than by position: which projects fold
 * depends on which are quiet, so a row's index is a fact about the fixture
 * rather than about the component.
 *
 * @param {object} props - the layer's props.
 * @returns {any[]} the project rows.
 */
function rowsOf(props) {
  return render(props).filter(
    node =>
      node.type === 'button' &&
      // The class is exactly `gv-project` when not current and `gv-project
      // current` when it is, so this cannot be a prefix test on a trailing space.
      /^gv-project( |$)/.test(node.props.className ?? ''),
  );
}

/**
 * One named project's row.
 * @param {object} props - the layer's props.
 * @param {string} name - the project to find.
 * @returns {any} the row.
 */
function rowFor(props, name) {
  const row = rowsOf(props).find(node => textOf(node.props).includes(name));
  assert.ok(row, `no row was drawn for ${name}`);
  return row;
}

/** The state dot inside a row. */
function dotIn(row) {
  return flatten(row).find(node => node.props?.className?.startsWith('gv-project-dot'));
}

/**
 * A discovered project, with only what the list route knows before any git ran.
 *
 * Names only, on purpose: what is waiting in the project arrives separately and
 * later, and the layer has to be useful before it does.
 */
const listed = (over = {}) => ({ path: 'D:/w/app', name: 'app', ...over });

/** What is waiting in one project, with only what the layer reads. */
const summary = (over = {}) => ({
  path: 'D:/w/app',
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
    assert.equal(ProjectLayer({ projects: [listed()], current: 'D:/w/app', onSelect: () => {} }), null);
  });

  check('an unknown project list renders nothing rather than a broken row', () => {
    assert.equal(ProjectLayer({ projects: undefined, current: undefined, onSelect: () => {} }), null);
  });

  check('every project is listed before a single summary has arrived', () => {
    // This is the property that keeps the panel off the critical path: the list
    // costs a filesystem walk and the summaries cost seconds, and a person
    // reading a list of names should not be held for the second one. Nothing is
    // folded here, because an unread project may be the one that needs you.
    const props = {
      projects: [listed(), listed({ path: 'D:/w/api', name: 'api' }), listed({ path: 'D:/w/web', name: 'web' })],
      summaries: undefined,
      current: 'D:/w/app',
      onSelect: () => {},
    };
    const rows = rowsOf(props);
    assert.equal(rows.length, 3, 'every project has a row from the start');
    for (const row of rows) {
      assert.ok(textOf(row.props).includes('projects.reading'), 'and says it has not read yet');
    }
  });

  check('a project not yet read is not dressed up as a clean one', () => {
    // The one thing this layer exists not to get wrong: a hollow dot and the
    // word "reading" must not be read as "nothing is waiting here".
    const props = {
      projects: [listed(), listed({ path: 'D:/w/api', name: 'api' })],
      summaries: [summary({ path: 'D:/w/app' })],
      current: 'D:/w/app',
      onSelect: () => {},
    };
    const dot = dotIn(rowFor(props, 'api'));
    assert.ok(dot.props.className.includes('pending'), 'the unanswered row is marked pending, not clean');
    assert.ok(!dot.props.className.includes('clean'));
    assert.ok(textOf(rowFor(props, 'api').props).includes('projects.reading'));
  });

  check('a quiet project is folded into a count, not listed', () => {
    // A working directory can hold a dozen repositories and usually one or two
    // are waiting on something. Listing all of them buries the answer in the
    // question, which is what the panel is for.
    const props = {
      projects: [listed(), listed({ path: 'D:/w/api', name: 'api' }), listed({ path: 'D:/w/web', name: 'web' })],
      summaries: [
        summary({ path: 'D:/w/app' }),
        summary({ path: 'D:/w/api', clean: true }),
        summary({ path: 'D:/w/web', clean: false, untracked: 3 }),
      ],
      current: 'D:/w/web',
      onSelect: () => {},
    };
    const rows = rowsOf(props);
    assert.equal(rows.length, 1, 'the quiet ones are not rows of their own');
    assert.ok(textOf(rows[0].props).includes('web'), 'the one with work is');
    assert.ok(textOf(rows[0].props).includes('projects.untrackedCount'), 'and says what is waiting');
    const folded = render(props).find(node => node.props?.className === 'gv-project-quiet');
    assert.ok(folded, 'the quiet projects are counted');
    assert.ok(textOf(folded.props).includes('projects.quietCount'), 'by a translated count');
  });

  check('the project being shown is never folded away', () => {
    // Folding the current project would take away the only row that says which
    // project the tree below belongs to.
    const props = {
      projects: [listed(), listed({ path: 'D:/w/api', name: 'api' })],
      summaries: [summary({ path: 'D:/w/app' }), summary({ path: 'D:/w/api' })],
      current: 'D:/w/app',
      onSelect: () => {},
    };
    assert.ok(rowFor(props, 'app'), 'the quiet current project keeps its row');
    assert.equal(rowsOf(props).length, 1);
  });

  check('the fold opens to name every quiet project', () => {
    const props = {
      projects: [listed(), listed({ path: 'D:/w/api', name: 'api' }), listed({ path: 'D:/w/web', name: 'web' })],
      summaries: [summary({ path: 'D:/w/api' }), summary({ path: 'D:/w/web' })],
      current: 'D:/w/elsewhere',
      onSelect: () => {},
    };
    // The component is executed rather than mounted, so the fold is asked for
    // the state it would be in after the click.
    useStateValue = true;
    try {
      assert.equal(rowsOf(props).length, 3, 'opening the fold draws the quiet projects');
    } finally {
      useStateValue = undefined;
    }
  });

  check('the current project is the marked one', () => {
    const props = {
      projects: [listed({ path: 'D:/w/a', name: 'a' }), listed({ path: 'D:/w/b', name: 'b' })],
      current: 'D:/w/b',
      onSelect: () => {},
    };
    assert.notEqual(rowFor(props, 'a').props.className.includes('current'), true);
    assert.equal(rowFor(props, 'b').props.className.includes('current'), true);
    assert.equal(rowFor(props, 'b').props['aria-current'], true);
  });

  check('a repository with no commits is named, not shown as HEAD', () => {
    // git reports the literal string "HEAD" as the branch of a repository with
    // no commits; rendering that raw looks like a broken branch rather than an
    // empty one.
    const props = {
      projects: [listed(), listed({ path: 'D:/w/new', name: 'new' })],
      summaries: [
        summary({ path: 'D:/w/app' }),
        summary({ path: 'D:/w/new', unborn: true, branch: 'HEAD', clean: false, untracked: 1 }),
      ],
      current: 'D:/w/app',
      onSelect: () => {},
    };
    const text = textOf(rowFor(props, 'new').props);
    assert.ok(text.includes('projects.noCommits'));
    assert.ok(!text.includes('HEAD'), 'the literal HEAD never reaches the row');
  });

  check('a detached head says so rather than showing nothing', () => {
    const props = {
      projects: [listed(), listed({ path: 'D:/w/d', name: 'd' })],
      summaries: [
        summary({ path: 'D:/w/app' }),
        summary({ path: 'D:/w/d', detached: true, branch: null, clean: false, unstaged: 2 }),
      ],
      current: 'D:/w/app',
      onSelect: () => {},
    };
    assert.ok(textOf(rowFor(props, 'd').props).includes('projects.detached'));
  });

  check('staged work is reported as ready, ahead of unstaged', () => {
    const props = {
      projects: [listed(), listed({ path: 'D:/w/m', name: 'm' })],
      summaries: [
        summary({ path: 'D:/w/app' }),
        summary({ path: 'D:/w/m', clean: false, staged: 3, unstaged: 9 }),
      ],
      current: 'D:/w/app',
      onSelect: () => {},
    };
    const text = textOf(rowFor(props, 'm').props);
    assert.ok(text.includes('projects.stagedCount'), 'the committable count leads');
    assert.ok(!text.includes('projects.unstagedCount'), 'so a commit button beside it is not a lie');
  });

  check('a conflict outranks every other count', () => {
    const props = {
      projects: [listed(), listed({ path: 'D:/w/c', name: 'c' })],
      summaries: [
        summary({ path: 'D:/w/app' }),
        summary({ path: 'D:/w/c', clean: false, staged: 1, conflicts: 2 }),
      ],
      current: 'D:/w/app',
      onSelect: () => {},
    };
    assert.ok(textOf(rowFor(props, 'c').props).includes('projects.stagedCount'));
    assert.ok(dotIn(rowFor(props, 'c')).props.className.includes('conflict'), 'and the dot says so too');
  });

  check('a project row selects and never stages', () => {
    // The rows below stage what they name. A box up here would read as
    // permission to stage across repositories, which no commit ever does.
    let chosen;
    const props = {
      projects: [listed(), listed({ path: 'D:/w/api', name: 'api' })],
      current: 'D:/w/app',
      onSelect: path => { chosen = path; },
    };
    const rows = rowsOf(props);
    for (const row of rows) {
      assert.equal(row.props.type, 'button');
      const markup = JSON.stringify(row.props, (key, value) => (typeof value === 'function' ? '[fn]' : value));
      assert.ok(!markup.includes('input'), 'a project row renders no input');
      assert.ok(!markup.includes('checkbox'), 'and no checkbox');
      assert.ok(!markup.includes('onCheck'), 'and nothing that stages');
    }
    rowFor(props, 'api').props.onClick();
    assert.equal(chosen, 'D:/w/api', 'clicking a row makes that project current');
  });

  check('the state dot distinguishes ready from merely changed', () => {
    /** The dot belonging to one project, drawn with a given state. */
    const dotFor = state => {
      const props = {
        // The project must sit at the summary's own path, or the lookup misses
        // and every row under test reads as pending. It is also made current, so
        // that a quiet one is still drawn: the layer never folds away the row
        // that says which project the tree belongs to.
        projects: [listed(), listed({ path: state.path, name: 'x' })],
        summaries: [summary({ path: 'D:/w/app' }), state],
        current: state.path,
        onSelect: () => {},
      };
      return dotIn(rowFor(props, 'x'));
    };
    const ready = dotFor(summary({ path: 'D:/w/r', clean: false, staged: 1 }));
    assert.ok(ready.props.className.endsWith('ready'), 'staged work is marked committable');
    const changed = dotFor(summary({ path: 'D:/w/u', clean: false, unstaged: 4 }));
    assert.ok(changed.props.className.endsWith('changed'), 'working-tree-only work is not committable');
    const quiet = dotFor(summary({ path: 'D:/w/c' }));
    assert.ok(quiet.props.className.endsWith('clean'), 'a quiet project says so');
    const clashing = dotFor(summary({ path: 'D:/w/k', clean: false, conflicts: 1 }));
    assert.ok(clashing.props.className.endsWith('conflict'), 'a conflict outranks everything');
  });
} finally {
  useStateValue = undefined;
  rmSync(out, { recursive: true, force: true });
}

process.stdout.write(failures === 0 ? '\nall project checks passed\n' : `\n${failures} project check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);