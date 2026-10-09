// Compose the loading probe and the opener into one setup.
//
// The harness runs a single setup file, and the delay has to be installed
// before the opener navigates — so the two are concatenated here rather than
// duplicating the sidebar navigation into a second opener.
//
// Usage: node scripts/compose-loading.mjs [route] [delayMs]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const route = process.argv[2] ?? 'git.status';
const delay = process.argv[3] ?? '5000';

const probe = readFileSync(join(here, 'loading-probe.js'), 'utf8');
const opener = readFileSync(join(here, 'open-git-view.js'), 'utf8');
const head = `globalThis.GV_SLOW_ROUTE=${JSON.stringify(route)};\nglobalThis.GV_LOADING_DELAY_MS=${Number(delay)};\n`;

writeFileSync(join(here, 'open-loading.js'), `${head}${probe}\n${opener}`, 'utf8');
process.stdout.write(`composed loading probe for ${route} (${delay}ms)\n`);
