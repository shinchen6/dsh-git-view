// A declared peer range the running harness cannot satisfy stops the whole
// plugin from loading ("skipping profile bundle ... is incompatible with dsh").
//
// This replicates the harness check exactly, because its shape is easy to get
// wrong: it compares each peer RANGE against the dsh RUNTIME version (not
// against the installed version of that package), with prereleases included,
// and it only looks at peers named "@deepseek-ai/dsh" or "@deepseek-ai/dsh-*".
// Anything not matching those names is never examined and cannot block startup.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const root = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** The dsh installation: the first npx cache entry that carries the runtime. */
function dshRoot() {
  const cache = join(process.env.LOCALAPPDATA ?? '', 'npm-cache', '_npx');
  if (!existsSync(cache)) return null;
  for (const entry of readdirSync(cache)) {
    const nm = join(cache, entry, 'node_modules');
    if (existsSync(join(nm, '@deepseek-ai', 'dsh', 'package.json'))) return nm;
  }
  return null;
}

const nm = dshRoot();
if (!nm) {
  console.log('SKIP: no dsh installation found, cannot check peer ranges');
  process.exit(0);
}

const runtimeVersion = JSON.parse(
  readFileSync(join(nm, '@deepseek-ai', 'dsh', 'package.json'), 'utf8'),
).version;
const semver = createRequire(join(nm, 'noop.js'))('semver');

const peers = Object.entries(pkg.peerDependencies ?? {});
if (peers.length === 0) {
  console.log('no peerDependencies declared');
  process.exit(0);
}

let failures = 0;
let examined = 0;
for (const [name, range] of peers) {
  if (name !== '@deepseek-ai/dsh' && !name.startsWith('@deepseek-ai/dsh-')) {
    console.log(`n/a  ${name} (never examined by the runtime)`);
    continue;
  }
  examined += 1;
  if (semver.satisfies(runtimeVersion, range, { includePrerelease: true })) {
    console.log(`ok   ${name} accepts runtime ${runtimeVersion}`);
  } else {
    console.log(`FAIL ${name} rejects runtime ${runtimeVersion}  (${range})`);
    failures += 1;
  }
}

if (examined === 0) {
  console.log('\nno @deepseek-ai/dsh* peer is declared, so nothing gates startup');
  process.exit(0);
}
if (failures > 0) {
  console.log(`\n${failures} peer range(s) would make dsh ${runtimeVersion} skip this plugin.`);
  process.exit(1);
}
console.log(`\ndsh ${runtimeVersion} will load this plugin`);
