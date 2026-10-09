// Put the panel into one demo state and leave it there; cdp.mjs takes the shot.
const dmWait = async (test, tries = 120) => {
  for (let i = 0; i < tries; i += 1) {
    if (test()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
};

await dmWait(() => document.querySelector('.gv-group-head'));

// The untracked group lists the working directory's other projects by name.
// A demo image has no business carrying them, so it is left folded.
const dmUntracked = [...document.querySelectorAll('.gv-group-head')]
  .find(e => e.innerText.replace(/\s+/g, ' ').startsWith('未跟踪'));
if (dmUntracked?.getAttribute('aria-expanded') === 'true') dmUntracked.click();
await new Promise(r => setTimeout(r, 500));

[...document.querySelectorAll('.gv-row')]
  .find(r => r.querySelector('.gv-name')?.textContent === 'users.js').click();

// Wait for the file to arrive, not merely for the click to land: a screenshot
// taken over the skeleton is a screenshot of a loading state.
const dmLoaded = await dmWait(
  () => document.querySelectorAll('.gv-line').length > 0 &&
        !document.querySelector('.gv-skeleton'),
);
return dmLoaded ? 'ready: whole file rendered' : 'TIMED OUT waiting for the file';