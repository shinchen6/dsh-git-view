/**
 * Wrap the esbuild output in the module loader's expected shape.
 *
 * The browser half of a client plugin is not an ES module: it calls
 * `window.__ModuleLoader__.load` with a factory that receives `require`, and
 * every external dependency is resolved through it. esbuild emits CommonJS for
 * exactly that reason, so all this does is add the wrapper and hand the factory
 * the parameter its `require` calls already expect.
 *
 * Run through scripts/build.mjs; not meant to be invoked directly.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The id the browser half registers under.
 *
 * The host composes one client graph row per package and keys it by the `name`
 * in that package's manifest, then looks the row up by that same name after the
 * bundle executes. A wrapper that spells anything else registers a factory no
 * row ever claims, and the row fails with "loaded without registering" instead
 * of the panel appearing. Read the name from the manifest so the two cannot
 * drift apart.
 */
const PACKAGE_ID = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
).name;

/**
 * Wrap one compiled module body.
 *
 * @param {string} body - esbuild's CommonJS output.
 * @returns {string} the browser module.
 */
export function wrap(body) {
  return `window.__ModuleLoader__.load({
  id: ${JSON.stringify(PACKAGE_ID)},
  factory: (require) => {
    var module = { exports: {} };
${body}
    return module.exports;
  },
});
`;
}

/**
 * Read esbuild's output and write the finished browser module.
 *
 * @param {string} input - path to esbuild's CommonJS output.
 * @param {string} output - path to the browser module.
 */
export function main(input, output) {
  writeFileSync(output, wrap(readFileSync(input, 'utf8')), 'utf8');
}