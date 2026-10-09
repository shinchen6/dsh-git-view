/**
 * Build the browser half.
 *
 * One esbuild pass turns `src/entry.jsx` into CommonJS with every dependency
 * left external, then `scripts/wrap.mjs` adds the module loader's wrapper. The
 * result is the single `client.js` the bundle ships.
 *
 * Run with: node scripts/build.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { main } from './wrap.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = join(root, 'build');
const entry = join(root, 'src', 'entry.jsx');
const intermediate = join(build, 'entry.cjs');
const output = join(root, 'client.js');

/** Everything the browser resolves at runtime rather than bundling. */
const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-store',
];

/** Hooks and helpers a source file must import before it may name them. */
const REACT_NAMES = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useReducer'];

/**
 * Fail on a React hook used without being imported.
 *
 * esbuild does not catch this: a bare `useState` is a free variable, not an
 * unresolved import, so the bundle builds clean and the panel throws
 * `useState is not defined` the first time it renders in a browser. The error
 * arrives as a blank view with no build output to explain it, which makes it one
 * of the more expensive mistakes available here.
 *
 * @returns {void}
 */
function checkReactImports() {
  const src = join(root, 'src');
  const problems = [];
  for (const name of readdirSync(src)) {
    if (!name.endsWith('.js') && !name.endsWith('.jsx')) continue;
    const file = join(src, name);
    const text = readFileSync(file, 'utf8');
    const imported = new Set();
    for (const match of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*'[^']*react[^']*'/g)) {
      for (const part of match[1].split(',')) imported.add(part.trim().split(/\s+as\s+/).pop());
    }
    for (const hook of REACT_NAMES) {
      // A call or a JSX-less reference; a word inside a comment or a string is
      // not a use of the hook.
      const used = new RegExp(`(^|[^.\\w$])${hook}\\s*[(<.]`).test(
        text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1'),
      );
      if (used && !imported.has(hook)) problems.push(`${name} uses ${hook} without importing it`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`unresolved React helpers:\n  ${problems.join('\n  ')}`);
  }
}

/**
 * Locate esbuild: a local install first, then the global one npm puts under the
 * platform's roaming directory.
 *
 * @returns {string} the path to esbuild's launcher script.
 */
function findEsbuild() {
  const candidates = [
    join(root, 'node_modules', 'esbuild', 'bin', 'esbuild'),
    process.env.APPDATA ? join(process.env.APPDATA, 'npm', 'node_modules', 'esbuild', 'bin', 'esbuild') : '',
    '/usr/local/bin/esbuild',
    '/usr/bin/esbuild',
  ];
  const found = candidates.find(candidate => candidate !== '' && existsSync(candidate));
  if (found === undefined) {
    throw new Error('esbuild not found. Install it with: npm install -g esbuild');
  }
  return found;
}

mkdirSync(build, { recursive: true });
checkReactImports();

execFileSync(
  process.execPath,
  [
    findEsbuild(),
    entry,
    '--bundle',
    '--format=cjs',
    '--platform=browser',
    '--jsx=automatic',
    '--target=chrome120',
    ...EXTERNALS.map(name => `--external:${name}`),
    `--outfile=${intermediate}`,
  ],
  { stdio: 'inherit' },
);

main(intermediate, output);
process.stdout.write(`built ${output}\n`);