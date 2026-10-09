const out = [];
const settle = async (ms = 500) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 30 && !document.querySelector('.gv-group-head'); i += 1) await settle(1000);

const btn = text => [...document.querySelectorAll('.gv-commit button')]
  .find(b => (b.innerText || '').replace(/\s+/g, ' ').trim().replace(/^[✓↑✨]\s*/, '') === text);
const ahead = () => [...document.querySelectorAll('.gv-head .gv-count')].map(e => e.innerText);

// Clicking a disabled button is a silent no-op, so nothing here clicks until
// the control says it is ready. The first attempt at this test failed exactly
// that way and looked like a broken push button.
const waitFor = async (label, predicate, budgetMs = 40000) => {
  const until = Date.now() + budgetMs;
  while (Date.now() < until) {
    if (predicate()) return true;
    await settle(500);
  }
  out.push(`TIMEOUT waiting for ${label}`);
  return false;
};

out.push('ahead before=' + JSON.stringify(ahead()));
const ready = await waitFor('push enabled', () => !btn('推送').disabled);
out.push('push enabled=' + !btn('推送').disabled + ' (waited for it)');
if (!ready) return out.join('\n');

btn('推送').click();
out.push('clicked push');

const settled = await waitFor('ahead badge to clear', () => ahead().length === 0);
out.push('ahead after=' + JSON.stringify(ahead()));
out.push('push settled=' + settled);
out.push('note=' + JSON.stringify(gvText('.gv-commit-note')));
out.push('banner=' + JSON.stringify(gvText('.gv-banner')));
out.push('push disabled again=' + btn('推送').disabled);
return out.join('\n');
