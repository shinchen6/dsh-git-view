const dmW = async (test, tries = 120) => {
  for (let i = 0; i < tries; i += 1) {
    if (test()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
};
await dmW(() => document.querySelector('.gv-group-head'));
const dmU = [...document.querySelectorAll('.gv-group-head')]
  .find(e => e.innerText.replace(/\s+/g, ' ').startsWith('未跟踪'));
if (dmU?.getAttribute('aria-expanded') === 'true') dmU.click();
await new Promise(r => setTimeout(r, 500));
[...document.querySelectorAll('.gv-row')]
  .find(r => r.querySelector('.gv-name')?.textContent === 'users.js').click();
await dmW(() => document.querySelectorAll('.gv-line').length > 0 && !document.querySelector('.gv-skeleton'));
document.querySelector('.gv-commit-expand')?.click();
await new Promise(r => setTimeout(r, 800));
const dmOk = await dmW(() => document.querySelectorAll('.gv-line').length > 0 && !document.querySelector('.gv-skeleton'));
return dmOk ? 'ready' : 'TIMED OUT';
