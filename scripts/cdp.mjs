/**
 * Drive the running DSH Web UI over the Chrome DevTools Protocol.
 *
 * The page holds a live connection open, so anything that waits for it to go
 * idle never returns. CDP is the way in: ask for the console and the exceptions
 * explicitly, wait a fixed moment, then read the document and stop. That is
 * enough to tell a crash from a blank render, and to see the crash's own text.
 *
 * Run with: node scripts/cdp.mjs [url] [waitMs]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_UNDER_TEST = process.argv[2] ?? 'http://127.0.0.1:3080';
const WAIT_MS = Number(process.argv[3] ?? 12000);
const PORT = 9335;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const profile = mkdtempSync(join(tmpdir(), 'dsh-git-view-cdp-'));

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    `--remote-debugging-port=${PORT}`,
    // Chrome refuses a DevTools WebSocket that carries no browser origin.
    '--remote-allow-origins=*',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

/**
 * Wait for Chrome's debugging endpoint, then open the page we want to look at.
 *
 * @returns {Promise<string>} the DevTools WebSocket URL of that page.
 */
async function openTarget() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_UNDER_TEST)}`, {
        method: 'PUT',
      });
      if (response.ok) return (await response.json()).webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting; fall through and try again.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Chrome never opened its debugging port');
}

const socket = new WebSocket(await openTarget());

let nextId = 1;
const pending = new Map();
const logs = [];
const exceptions = [];
const failures = [];

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id !== undefined && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(`${message.error.message} (${method_of(message)})`));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    logs.push(
      `[${message.params.type}] ${message.params.args.map(arg => arg.value ?? arg.description ?? '?').join(' ')}`,
    );
  }
  if (message.method === 'Runtime.exceptionThrown') {
    const details = message.params.exceptionDetails;
    exceptions.push(`${details.text} ${details.exception?.description ?? ''}`.trim());
  }
  if (message.method === 'Network.loadingFailed' && message.params.canceled !== true) {
    failures.push(`${message.params.type}: ${message.params.errorText}`);
  }
});

/** Recover the failing command name for a protocol error. */
function method_of(message) {
  return message.method ?? 'unknown';
}

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', () => reject(new Error('DevTools socket failed')), { once: true });
});

await send('Log.enable');
await send('Page.enable');
await send('Network.enable');
// Lay the page out at a real window, not the 800x600 headless default: judging
// a two-column layout at 800px is judging it against a shape nobody uses.
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(process.env.GIT_VIEW_WIDTH ?? 1440),
  height: Number(process.env.GIT_VIEW_HEIGHT ?? 900),
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.reload', { ignoreCache: true });
await send('Page.setLifecycleEventsEnabled', { enabled: true });

await new Promise(resolve => setTimeout(resolve, WAIT_MS));

// Runtime is enabled *after* the reload, not before. Enabling it first binds
// the default execution context to the document that is about to be destroyed,
// and every later evaluate then answers from a torn-down page: an empty DOM,
// zero elements, and a step that looks like the product is blank when it is
// only the harness talking to a dead context.
await send('Runtime.enable');

/**
 * Evaluate one expression in the page and hand back its value.
 *
 * @param {string} expression - JavaScript to run.
 * @returns {Promise<any>} whatever it produced.
 */
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) return `THREW: ${result.exceptionDetails.text}`;
  return result.result?.value;
}

/**
 * Wait until the app has actually mounted.
 *
 * A fixed delay is a guess that fails in both directions: too short and the
 * step runs against a half-built DOM and reports an empty page as a product
 * bug, too long and every run pays for it. The sidebar is the last thing to
 * appear and is present in every run that is genuinely ready.
 *
 * @param {number} ms - how long to keep trying.
 * @returns {Promise<boolean>} whether it became ready.
 */
async function waitForApp(ms) {
  const deadline = Date.now() + ms;
  let best = 0;
  while (Date.now() < deadline) {
    const count = await evaluate('document.querySelectorAll("*").length');
    if (typeof count === 'number' && count > best) best = count;
    // The sidebar carries the workspace rows; without them nothing downstream
    // can run, so their presence is the readiness signal rather than a size.
    const ready = await evaluate('document.querySelectorAll(".hHd-Xa_root, [class*=projectRow]").length');
    if (typeof ready === 'number' && ready > 0) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  process.stdout.write(`--- app never became ready (best element count ${best}) ---\n`);
  return false;
}

await waitForApp(Number(process.env.GIT_VIEW_READY_TIMEOUT_MS ?? 60000));

/** Console errors raised by this run are only interesting from the load itself. */
const stepStart = logs.length;

// A step can arrive inline in the environment or as a path to a file. The file
// form is not a convenience: PowerShell mangles `\.` and `$/` passing them
// through an environment variable, so any step written as an inline literal
// silently tests something other than what it says.
const readStep = value => (value.endsWith('.js') ? readFileSync(value, 'utf8') : value);
const setup = process.env.GIT_VIEW_SETUP_FILE === undefined
  ? ''
  : `${readStep(process.env.GIT_VIEW_SETUP_FILE)}\n`;
// A setup on its own is a valid step. Driving the page to a known state and
// stopping there is how a screenshot gets taken; requiring a click file just to
// reach that state made the setup silently do nothing and the screenshot show
// whatever the page happened to be doing.
const hasStep = process.env.GIT_VIEW_CLICK_FILE !== undefined || process.env.GIT_VIEW_CLICK !== undefined;
const clickSource = process.env.GIT_VIEW_CLICK_FILE !== undefined
  ? `${setup}${readStep(process.env.GIT_VIEW_CLICK_FILE)}`
  : process.env.GIT_VIEW_CLICK === undefined
    ? setup
    : `${setup}${process.env.GIT_VIEW_CLICK}`;

if (hasStep || setup.trim() !== '') {
  // The steps need to wait between clicks, so this one may be an async IIFE.
  const step = await send('Runtime.evaluate', {
    expression: `(async () => { ${clickSource} })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  // `exceptionDetails.text` is the bare string "Uncaught"; the message the step
  // actually threw with lives in the nested description. Reporting only the
  // former turns every diagnostic into "Uncaught", which says nothing.
  const thrown = step.exceptionDetails?.exception?.description ?? step.exceptionDetails?.text;
  process.stdout.write(`--- click step ---\n${thrown !== undefined ? `THREW: ${thrown}` : step.result?.value}\n\n`);
  await new Promise(resolve => setTimeout(resolve, Number(process.env.GIT_VIEW_AFTER ?? 6000)));
}
const stepLogs = logs.slice(stepStart);

const report = {
  title: await evaluate('document.title'),
  location: await evaluate('location.href'),
  root: await evaluate(
    "(() => { const r = document.getElementById('root'); return r === null ? '(no #root)' : r.innerHTML.length + ' chars :: ' + r.innerHTML.slice(0, 500); })()",
  ),
  bodyText: await evaluate(
    "document.body ? document.body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 1200) : '(no body)'",
  ),
  bootKeys: await evaluate(
    "(() => { const g = window.__DSH_BOOT__; return g === undefined ? '(no boot payload)' : Object.keys(g).join(', '); })()",
  ),
  moduleLoader: await evaluate(
    "(() => { const l = window.__ModuleLoader__; return l === undefined ? '(no loader)' : typeof l.load + ' / ' + Object.keys(l).join(','); })()",
  ),
  elementCount: await evaluate('document.querySelectorAll("*").length'),
  buttons: await evaluate(
    "[...document.querySelectorAll('button')].slice(0, 60).map(b => (b.getAttribute('aria-label') || b.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 40)).filter(Boolean).join(' | ')",
  ),
  tabs: await evaluate(
    "[...document.querySelectorAll('[role=tab], [data-slot*=tab], button')].filter(e => /^(Git|对话|轨迹)$/.test((e.innerText || '').trim())).map(e => e.tagName + ':' + e.innerText.trim()).join(' | ') || '(no view tabs found)'",
  ),
};

process.stdout.write(`--- page ---\ntitle: ${report.title}\nurl: ${report.location}\nelements: ${report.elementCount}\nboot: ${report.bootKeys}\nloader: ${report.moduleLoader}\n\n`);
process.stdout.write(`--- view tabs ---\n${report.tabs}\n\n`);
process.stdout.write(`--- buttons ---\n${report.buttons}\n\n`);
process.stdout.write(`--- exceptions (${exceptions.length}) ---\n${exceptions.join('\n\n') || '(none)'}\n\n`);
process.stdout.write(`--- console (${logs.length}, ${stepLogs.length} after the click step) ---\n${[...logs.slice(0, 20), ...stepLogs.slice(0, 30)].join('\n') || '(none)'}\n\n`);
process.stdout.write(`--- failed loads (${failures.length}) ---\n${failures.slice(0, 20).join('\n') || '(none)'}\n\n`);
process.stdout.write(`--- #root ---\n${report.root}\n\n`);
process.stdout.write(`--- visible text ---\n${report.bodyText}\n`);

if (process.env.GIT_VIEW_SHOT !== undefined) {
  // GIT_VIEW_SHOT_CLIP=x,y,w,h crops the image. A full-page shot carries the
  // session sidebar, and session titles are the user's private text — so any
  // image meant for the README is taken of the panel alone.
  const clip = process.env.GIT_VIEW_SHOT_CLIP?.split(',').map(Number);
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    ...(clip?.length === 4 && clip.every(Number.isFinite)
      ? { clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3], scale: 1 } }
      : {}),
  });
  writeFileSync(process.env.GIT_VIEW_SHOT, Buffer.from(shot.data, 'base64'));
  process.stdout.write(`\n--- screenshot: ${process.env.GIT_VIEW_SHOT}\n`);
}

socket.close();
chrome.kill();
await new Promise(resolve => setTimeout(resolve, 500));
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch {
  // Chrome still holds its profile files; the OS will reclaim the temp dir.
}
process.exit(0);
