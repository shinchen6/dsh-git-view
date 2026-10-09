/**
 * Open the Git view and wait for it to be usable.
 *
 * Every browser check starts here. The sidebar is content-driven, so the same
 * script has to cope with the session list being collapsed, paginated behind
 * 展开其余, or the project row being anywhere in the tree — none of which is a
 * stable selector to hard-code.
 *
 * The Git tab then loads a session's working directory asynchronously, so
 * "the tab is selected" is not the same as "the tree has rendered". Polling for
 * `.gv-group-head` is the only honest readiness signal.
 */
const openSb = [...document.querySelectorAll('button')].find(
  x => /打开侧边栏/.test(x.getAttribute('aria-label') || ''),
);
if (openSb) openSb.click();
await new Promise(r => setTimeout(r, 3500));

const TITLE = '审查git变更';

/** The smallest element carrying the title is the row itself, not a container. */
const rowFor = title =>
  [...document.querySelectorAll('button,[role=button],li,a,div')]
    .filter(x => (x.innerText || '').includes(title))
    .sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)[0];

// Expanding the project row is a toggle, so clicking it on every retry closes
// the list again on the second attempt. Do it once, then only ever widen the
// list with 展开其余.
const expandProject = async () => {
  const project = [...document.querySelectorAll('.YDXeBa_projectRow')].find(r =>
    (r.textContent || '').trim().startsWith('temp'),
  );
  if (!project) throw new Error('the temp project row is not in the sidebar');
  project.click();
  await new Promise(r => setTimeout(r, 3500));
};

const expandRest = async () => {
  const more = [...document.querySelectorAll('button')].find(x => /展开其余/.test(x.innerText || ''));
  if (!more) return false;
  more.click();
  await new Promise(r => setTimeout(r, 2500));
  return true;
};

// `aria-expanded` on the project row is the only honest signal for whether its
// sessions are listed. Guessing by clicking is wrong in both directions: the
// click is a toggle, so clicking an already-open project closes it and the
// session it was supposed to reveal never appears.
const tempProject = () =>
  [...document.querySelectorAll('.YDXeBa_projectRow')].find(r =>
    (r.textContent || '').trim().startsWith('temp'),
  );

const ensureExpanded = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const project = tempProject();
    if (!project) throw new Error('the temp project row is not in the sidebar');
    if (project.getAttribute('aria-expanded') === 'true') return;
    project.click();
    await new Promise(r => setTimeout(r, 3500));
  }
  throw new Error('the temp project never expanded');
};

await ensureExpanded();
let opened = false;
for (let attempt = 0; attempt < 8 && !opened; attempt++) {
  const row = rowFor(TITLE);
  if (row !== undefined) {
    row.click();
    opened = true;
    break;
  }
  await expandRest();
}

if (!opened) {
  throw new Error(`no session row matching ${TITLE} after expanding the project`);
}

await new Promise(r => setTimeout(r, 9000));
const gitTab = [...document.querySelectorAll('[role=tab],button')].find(
  x => (x.innerText || '').trim() === 'Git',
);
if (!gitTab) throw new Error('the Git tab is missing from the conversation view');
gitTab.click();

let head;
for (let i = 0; i < 30 && !head; i++) {
  head = document.querySelector('.gv-group-head');
  if (!head) await new Promise(r => setTimeout(r, 1000));
}
if (!head) throw new Error('the git view never rendered its group headings');

/**
 * Helpers for the step scripts, hung off the global object.
 *
 * The harness concatenates the opener and the step into a single async IIFE, so
 * every `const` in this file shares one scope with the step. A helper called
 * `head` or `text` here then makes the step die with "already been declared"
 * before it runs a single assertion — a harness failure that reads exactly
 * like a product failure. Globals sidestep the collision entirely.
 */
globalThis.gvWatchSession = async ms => {
  const seen = [];
  const real = window.fetch;
  window.fetch = function patched(url, ...rest) {
    const raw = String(url && url.url ? url.url : url);
    const found = raw.match(/sessionId=([^&]+)/);
    if (found) seen.push(found[1]);
    return real.call(this, url, ...rest);
  };
  const refresh = [...document.querySelectorAll('.gv-head button')].find(b =>
    (b.innerText || '').includes('刷新'),
  );
  if (refresh) refresh.click();
  await new Promise(r => setTimeout(r, ms));
  window.fetch = real;
  return seen[0];
};

/** Read a string out of the rendered panel, or a marker saying it is absent. */
globalThis.gvText = selector => {
  const el = document.querySelector(selector);
  return el ? (el.innerText || '').trim() : '<absent>';
};

