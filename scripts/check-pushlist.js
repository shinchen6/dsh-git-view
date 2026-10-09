const out = [];
const settle = async (ms = 400) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 240 && !document.querySelector('.gv-group-head'); i += 1) await settle(250);
await settle(2000);

const barBtn = label => [...document.querySelectorAll('.gv-commit-bar button')]
  .find(b => (b.innerText || '').replace(/\s+/g, ' ').trim().replace(/^[✓↑✨…]\s*/, '') === label);

out.push('header ahead badge=' + JSON.stringify([...document.querySelectorAll('.gv-badge, .gv-ahead')]
  .map(e => e.textContent)));

const push = barBtn('推送');
out.push('push disabled=' + push.disabled + ' title=' + JSON.stringify(push.getAttribute('title')));
push.click();
await settle(1500);

const modal = document.querySelector('.gv-push-modal');
out.push('dialog present=' + (modal !== null));
if (modal !== null) {
  out.push('title=' + JSON.stringify(modal.querySelector('h1,h2,[class*="title"]')?.textContent));
  out.push('lines=' + JSON.stringify(modal.innerText.split('\n').map(s => s.trim()).filter(Boolean)));
  const items = [...modal.querySelectorAll('.gv-push-commit')];
  out.push('commits listed=' + items.length);
  for (const li of items) {
    out.push('  sha=' + JSON.stringify(li.querySelector('.gv-push-sha').textContent) +
             ' subject=' + JSON.stringify(li.querySelector('.gv-push-subject').textContent));
  }
}
return out.join('\n');