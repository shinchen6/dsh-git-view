/**
 * Prepend to the opener to make the first status call slow enough to observe.
 *
 * The skeleton only exists before the first answer arrives, which on this
 * repository is a few hundred milliseconds — too short to assert against
 * reliably, and too short to screenshot. Delaying the route makes the state
 * last long enough to inspect.
 *
 * The observation is recorded rather than asserted here, because the opener
 * waits for the real content before returning. A MutationObserver sees the
 * transient state on the way past; the step reads what it saw.
 */
const LOADING_DELAY_MS = Number(globalThis.GV_LOADING_DELAY_MS ?? 5000);
// Which route to stall. The probe is composed ahead of the opener, so the
// composer sets this by prepending a line rather than by editing this file.
const SLOW_ROUTE = globalThis.GV_SLOW_ROUTE ?? 'git.status';

globalThis.gvLoadingSaw = { skeleton: false, refreshLabel: undefined, rowsAtSkeleton: undefined };

const realFetch = window.fetch;
window.fetch = function slowStatus(url, ...rest) {
  const raw = String(url && url.url ? url.url : url);
  if (!raw.includes(`/api/${SLOW_ROUTE}`)) return realFetch.call(this, url, ...rest);
  return new Promise((resolve, reject) => {
    setTimeout(() => realFetch.call(this, url, ...rest).then(resolve, reject), LOADING_DELAY_MS);
  });
};

// Poll rather than observe: the skeleton is inside a subtree that mounts after
// this runs, and a single frame is enough to catch it.
globalThis.gvWatchLoading = () => {
  const timer = setInterval(() => {
    const skeleton = document.querySelector('.gv-sk');
    if (skeleton === null) return;
    const gvLoadingSaw = globalThis.gvLoadingSaw;
    gvLoadingSaw.skeleton = true;
    // Count what the placeholder is standing in for, so the step can compare
    // the shape it drew against the shape that arrived.
    gvLoadingSaw.rowsAtSkeleton = document.querySelectorAll('.gv-sk-row').length;
    const refresh = [...document.querySelectorAll('.gv-head button')].find(b =>
      (b.innerText || '').includes('刷新') || (b.innerText || '').includes('正在刷新'),
    );
    if (refresh) gvLoadingSaw.refreshLabel = (refresh.innerText || '').replace(/\s+/g, ' ').trim();
    clearInterval(timer);
  }, 40);
  return timer;
};

globalThis.gvWatchLoading();
