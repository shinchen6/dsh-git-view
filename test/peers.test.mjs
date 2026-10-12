// A declared peer range the running harness cannot satisfy stops the whole
// plugin from loading, so every peer is checked against the version the local
// harness actually ships before it is published.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const root = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** node_modules roots to resolve against: the profile first, then the dsh install. */
function roots() {
  const found = [];
  if (process.env.DSH_PROFILE_DIR) found.push(join(process.env.DSH_PROFILE_DIR, 'node_modules'));
  const cache = join(process.env.LOCALAPPDATA ?? '', 'npm-cache', '_npx');
  if (existsSync(cache)) {
    for (const entry of readdirSync(cache)) {
      const nm = join(cache, entry, 'node_modules');
      if (existsSync(join(nm, '@deepseek-ai', 'dsh', 'package.json'))) found.push(nm);
    }
  }
  return found;
}

function versionsOf(name) {
  const out = [];
  for (const nm of roots()) {
    const p = join(nm, name, 'package.json');
    if (existsSync(p)) out.push([nm, JSON.parse(readFileSync(p, 'utf8')).version]);
  }
  return out;
}

const semver = (() => {
  for (const nm of roots()) {
    if (existsSync(join(nm, 'semver', 'package.json'))) {
      return createRequire(join(nm, 'noop.js'))('semver');
    }
  }
  return null;
})();

const peers = Object.entries(pkg.peerDependencies ?? {});
if (peers.length === 0) {
  console.log('no peerDependencies declared');
  process.exit(0);
}
if (!semver) {
  console.log('SKIP: no semver next to a dsh install, cannot verify ranges');
  process.exit(0);
}

let failures = 0;
for (const [name, range] of peers) {
  const found = versionsOf(name);
  if (found.length === 0) {
    console.log(`SKIP ${name}: not installed here, cannot check ${range}`);
    continue;
  }
  // Every resolvable copy has to satisfy the range: which node_modules the
  // harness picks first is not something the manifest can rely on.
  for (const [nm, version] of found) {
    if (semver.satisfies(version, range)) {
      console.log(`ok   ${name} ${version} satisfies ${range}`);
    } else {
      console.log(`FAIL ${name} ${version} does NOT satisfy ${range}  (${nm})`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.log(`\n${failures} peer range(s) would stop this plugin from loading.`);
  process.exit(1);
}
console.log('\nall peer ranges accepted by the local harness');
