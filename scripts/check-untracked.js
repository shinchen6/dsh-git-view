const out = [];
const settle = async (ms = 300) => { await new Promise(r => setTimeout(r, ms)); };

// Count the requests the untracked route receives, so "only what was opened" is
// a number and not a claim.
let hits = 0;
const realFetch = window.fetch;
window.fetch = (...a) => { if (String(a[0]).includes('git.untracked')) hits += 1; return realFetch(...a); };

for (let i = 0; i < 240 && !document.querySelector('.gv-group-head'); i += 1) await settle(250);
await settle(2500);
out.push('untracked requests after load = ' + hits + ' (the group holds 177 rows)');

const group = [...document.querySelectorAll('.gv-tree-scroll section')]
  .find(s => s.querySelector('.gv-group-head')?.innerText.includes('未跟踪'));
if (group.querySelector('.gv-group-head').getAttribute('aria-expanded') === 'false') {
  group.querySelector('.gv-group-head').click();
  await settle(600);
}
const dirs = [...group.querySelectorAll('.gv-dir')];
out.push('directories listed = ' + dirs.length);
out.push('all start folded = ' + dirs.every(d => d.getAttribute('aria-expanded') === 'false'));

const before = hits;
const target = dirs.find(d => d.querySelector('.gv-name').textContent === '.vscode');
const t1 = performance.now();
target.click();
for (let i = 0; i < 60; i += 1) {
  await settle(250);
  if (group.querySelectorAll('.gv-row-wrap').length > dirs.length + 1) break;
}
out.push(`opened .vscode in ${Math.round(performance.now() - t1)}ms, ${hits - before} request(s)`);
const names = [...group.querySelectorAll('.gv-name')].map(e => e.textContent);
out.push('now showing = ' + JSON.stringify(names.slice(names.indexOf('.vscode'), names.indexOf('.vscode') + 6)));

// Opening a second one must not refetch the first.
const after1 = hits;
dirs.find(d => d.querySelector('.gv-name').textContent === '.trae').click();
await settle(2000);
out.push('opening a second directory cost ' + (hits - after1) + ' request(s)');
return out.join('\n');