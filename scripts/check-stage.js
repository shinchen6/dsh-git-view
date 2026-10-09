const out = [];
const wrapFor = name =>
  [...document.querySelectorAll('.gv-row-wrap')].find(w => (w.innerText || '').includes(name));
const groups = () => [...document.querySelectorAll('.gv-group-head')].map(h => (h.innerText || '').replace(/\s+/g, ' ').trim());
const settle = async () => { await new Promise(r => setTimeout(r, 2600)); };

out.push('groups start=' + JSON.stringify(groups()));

// The overflow menu on a staged row.
let wrap = wrapFor('plain.txt');
const more = wrap.querySelector('.gv-more');
more.click();
await settle();
const items = [...document.querySelectorAll('[role=menuitem]')];
out.push('menu items=' + JSON.stringify(items.map(i => (i.innerText || '').trim())));
out.push('menu expanded=' + more.getAttribute('aria-expanded'));

// Close it without acting, so the menu cannot leak into the next assertion.
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
await settle();

// Unstage via the inline quick action, which is what the minus is for.
wrap = wrapFor('plain.txt');
const quick = wrap.querySelector('.gv-quick');
out.push('quick=' + quick.getAttribute('aria-label'));
quick.click();
await settle();
out.push('groups after unstage=' + JSON.stringify(groups()));

// Stage it back through the checkbox, so the round trip is complete.
const box = [...document.querySelectorAll('.gv-check input')];
out.push('checks now=' + box.length);
const again = [...document.querySelectorAll('.gv-row-wrap')].find(w => (w.innerText || '').includes('plain.txt'));
again.querySelector('.gv-quick').click();
await settle();
out.push('groups after restage=' + JSON.stringify(groups()));
out.push('groups final   =' + JSON.stringify(groups()));
return out.join('\n');