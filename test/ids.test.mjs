// The host composes one client-graph row per package, keyed by the `name` in
// that package's manifest, and looks the row up by that same name once the
// bundle executes. If the wrapper in client.js registers under anything else,
// no row ever claims the factory: the panel silently never appears and the row
// reports "loaded without registering".
//
// The three places that name the plugin therefore have to agree, and a rename
// that touches only one of them is exactly the mistake this catches.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const read = f => readFileSync(join(root, f), 'utf8');

const manifest = JSON.parse(read('package.json')).name;
const registered = read('client.js').match(/^\s*id:\s*"([^"]+)"/m)?.[1];
const patched = read('cordis.patch.yml').match(/name:\s*'([^']+)'/)?.[1];

let failures = 0;
const seen = [
  ['package.json name', manifest],
  ['client.js registered id', registered],
  ['cordis.patch.yml name', patched],
];

for (const [where, value] of seen) {
  if (!value) {
    console.log(`FAIL ${where}: not found`);
    failures += 1;
  } else if (value !== manifest) {
    console.log(`FAIL ${where}: ${value} != ${manifest}`);
    failures += 1;
  } else {
    console.log(`ok   ${where}: ${value}`);
  }
}

if (failures > 0) {
  console.log('\nthe host would compose a row that nothing registers under.');
  process.exit(1);
}
console.log('\nall three identifiers agree');
