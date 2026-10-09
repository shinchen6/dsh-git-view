const out = [];
const settle = async (ms = 400) => { await new Promise(r => setTimeout(r, ms)); };

// Time the view reaching its first rendered status, the thing the user waits for.
const t0 = performance.now();
for (let i = 0; i < 200 && !document.querySelector('.gv-group-head'); i += 1) await settle(250);
out.push('view ready in ' + Math.round(performance.now() - t0) + 'ms');

const heads = () => [...document.querySelectorAll('.gv-group-head')].map(e => e.innerText.split('\n')[0]);
out.push('groups=' + JSON.stringify(heads()));

// The untracked group should now hold directories, not 500 files.
const untracked = [...document.querySelectorAll('.gv-tree-scroll section')]
  .find(s => s.innerText.includes('未跟踪'));
const dirRows = [...untracked.querySelectorAll('.gv-dir')].map(d => d.querySelector('.gv-name').textContent);
out.push('untracked rows=' + untracked.querySelectorAll('.gv-row-wrap').length + ' dirs=' + JSON.stringify(dirRows));

// Open the fixture directory and see whether its contents arrive.
const t = [...untracked.querySelectorAll('.gv-dir')].find(d => d.querySelector('.gv-name').textContent === 't');
if (t === undefined) { out.push('no t/ row'); return out.join('\n'); }
const t1 = performance.now();
t.click();
for (let i = 0; i < 60; i += 1) {
  await settle(250);
  if ([...untracked.querySelectorAll('.gv-name')].some(e => e.textContent === 'users.js')) break;
}
out.push('t/ opened in ' + Math.round(performance.now() - t1) + 'ms');
out.push('under t/ = ' + JSON.stringify([...untracked.querySelectorAll('.gv-name')].map(e => e.textContent)));
return out.join('\n');