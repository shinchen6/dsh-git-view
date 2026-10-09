/**
 * Load the compiled browser module the way the page would, and apply it.
 *
 * A blank page after installing a client plugin almost always means the module
 * factory threw, and that throw only ever happened in the browser. This runs
 * the same `client.js` in Node against stand-ins for the two things it reaches
 * for, so the failure arrives here first with a stack trace.
 *
 * React and the primitives are stubbed rather than loaded: neither has a Node
 * entry point (the primitives pull in CSS), and neither is what throws. What is
 * exercised is this module's own code — its factory, its exported `inject` list,
 * and its `apply`.
 *
 * Run with: node scripts/simulate.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Everything the module asked for but that has no Node entry point. */
const stub = name => {
  throw new Error(`the module required "${name}", which has no Node entry point here`);
};

const react = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  Fragment: Symbol('Fragment'),
  useState: () => [undefined, () => {}],
  useEffect: () => {},
  useRef: () => ({ current: undefined }),
  useCallback: fn => fn,
  useMemo: () => undefined,
  useId: () => 'id',
};
react.default = react;

const jsx = (type, props) => ({ type, props });
const jsxRuntime = { jsx, jsxs: jsx, jsxDEV: jsx, Fragment: react.Fragment };

/** A component stand-in that records which primitive was actually reached for. */
const component = name => {
  const stubbed = (...args) => ({ type: name, props: args[0] });
  Object.defineProperty(stubbed, 'name', { value: name });
  return stubbed;
};

const primitives = new Proxy(
  {
    CodeBlock: component('CodeBlock'),
    MarkdownText: component('MarkdownText'),
    Menu: component('Menu'),
    MenuItemButton: component('MenuItemButton'),
    RiskConfirmation: component('RiskConfirmation'),
    languageForPath: () => 'plaintext',
  },
  {
    get: (target, property) => {
      if (typeof property !== 'string') return undefined;
      // The platform exports far more than this plugin uses; a miss is a real
      // signal, so report it rather than silently handing back undefined.
      if (property in target) return target[property];
      throw new Error(`the module required "${property}" from the primitives, which is not exported`);
    },
  },
);

const require_ = name => {
  if (name === 'react') return react;
  if (name === 'react/jsx-runtime') return jsxRuntime;
  if (name === 'react-dom') return { createPortal: node => node };
  if (name === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
  if (name === '@deepseek-ai/dsh-client-store') return {};
  return stub(name);
};

// --- the page ---------------------------------------------------------------
const registered = [];
let lastExports;
globalThis.window = {
  __ModuleLoader__: {
    load({ id, factory }) {
      registered.push(id);
      lastExports = factory(require_);
      return lastExports;
    },
  },
};

await import(pathToFileURL(join(root, 'client.js')).href);

console.log(`modules loaded: ${registered.join(', ') || '(none)'}`);

const exports = lastExports;
console.log(`exports: ${Object.keys(exports).join(', ')}`);
console.log(`inject: ${JSON.stringify(exports.inject)}`);

/** Record every service call the plugin makes, then insist it made the right ones. */
const calls = [];
const service = (name, ...results) => ({
  get: () => results[0],
  register: value => calls.push([name, value]),
  inject: (slot, supply) => calls.push([`inject:${slot}`, supply()]),
});

const ctx = {
  slots: service('slots'),
  uiSession: service('uiSession'),
  locale: {
    ...service('locale'),
    register: (ns, dicts) => calls.push(['locale.register', { ns, languages: Object.keys(dicts) }]),
    bind: ns => key => key,
  },
  effect: callback => {
    const disposer = callback();
    calls.push(['effect', typeof disposer]);
    return typeof disposer === 'function' ? disposer : () => {};
  },
  logger: { warn: (...args) => console.warn('logger.warn:', ...args) },
};

exports.apply(ctx);

for (const [name, value] of calls) {
  console.log(`  ${name}: ${JSON.stringify(value, (key, item) => (typeof item === 'function' ? `[fn ${item.name ?? 'anonymous'}]` : item))}`);
}

const view = calls.find(([name]) => name === 'slots');
if (view === undefined) {
  console.error('\nFAIL: the plugin never registered into conversation.view');
  process.exit(1);
}
const meta = view[1];
console.log(`\nregistered view: id=${meta.id} order=${meta.order} locale=${meta.locale} label=${meta.label()}`);
console.log('OK: the module loads and registers the view.');
