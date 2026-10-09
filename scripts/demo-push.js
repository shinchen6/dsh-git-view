const dmSettle3 = async (ms = 400) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 240 && !document.querySelector('.gv-group-head'); i += 1) await dmSettle3(250);

const dmUntracked3 = [...document.querySelectorAll('.gv-group-head')]
  .find(e => e.innerText.replace(/\s+/g, ' ').startsWith('未跟踪'));
if (dmUntracked3?.getAttribute('aria-expanded') === 'true') dmUntracked3.click();
await dmSettle3(400);

[...document.querySelectorAll('.gv-commit-bar button')]
  .find(b => b.innerText.replace(/\s+/g, ' ').includes('推送')).click();
await dmSettle3(1500);
return 'ready';