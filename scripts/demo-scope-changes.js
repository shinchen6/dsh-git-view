const dmWaitC = async (test, tries = 160) => {
  for (let i = 0; i < tries; i += 1) {
    if (test()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
};
await dmWaitC(() => document.querySelector('.gv-group-head'));

const dmUntrackedC = [...document.querySelectorAll('.gv-group-head')]
  .find(e => e.innerText.replace(/\s+/g, ' ').startsWith('未跟踪'));
if (dmUntrackedC?.getAttribute('aria-expanded') === 'true') dmUntrackedC.click();

const dmRowC = await dmWaitC(
  () => [...document.querySelectorAll('.gv-row')]
    .some(r => r.querySelector('.gv-name')?.textContent === 'users.js'),
);
if (!dmRowC) return 'TIMED OUT waiting for the file row';

[...document.querySelectorAll('.gv-row')]
  .find(r => r.querySelector('.gv-name')?.textContent === 'users.js').click();

await dmWaitC(() => document.querySelectorAll('.gv-line').length > 0 && !document.querySelector('.gv-skeleton'));
[...document.querySelectorAll('button')]
  .find(b => b.innerText.trim() === '只看变动')?.click();
await new Promise(r => setTimeout(r, 900));

const dmOkC = await dmWaitC(
  () => document.querySelectorAll('.gv-line').length > 0 && !document.querySelector('.gv-skeleton'),
);
return dmOkC ? 'ready' : 'TIMED OUT after switching scope';