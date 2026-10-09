const out = [];
const settle = async (ms = 1000) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 30 && !document.querySelector('.gv-group-head'); i += 1) await settle(1000);

// "暂存的更改" also contains "更改", so a substring match picks the wrong
// group. Compare the title with its count stripped, exactly.
const titleOf = g => (g.querySelector('.gv-group-head')?.innerText || '')
  .replace(/^[▾▸]\s*/, '').replace(/\s*\(\d+\).*$/s, '').trim();
const group = name => [...document.querySelectorAll('.gv-group')].find(g => titleOf(g) === name);
const dirRow = (groupName, dirName) => {
  const g = group(groupName);
  if (g === undefined) return undefined;
  return [...g.querySelectorAll('.gv-dir')].find(r => (r.querySelector('.gv-name')?.innerText || '') === dirName);
};

out.push('group titles=' + JSON.stringify([...document.querySelectorAll('.gv-group')].map(titleOf)));
const util = dirRow('更改', 'util');
out.push('util row in 更改=' + (util !== undefined));
if (util === undefined) return out.join('\n');

const wrap = util.closest('.gv-row-wrap');
const actions = wrap.querySelector('.gv-row-actions');
out.push('actions strip=' + (actions !== null));
out.push('actions opacity at rest=' + getComputedStyle(actions).opacity);
out.push('buttons=' + JSON.stringify([...actions.querySelectorAll('button')].map(b => `${b.innerText.trim()}:${b.getAttribute('title')}`)));

const before = [...group('更改').querySelectorAll('.gv-row:not(.gv-dir)')].map(r => r.getAttribute('title'));
out.push('files under 更改 before=' + JSON.stringify(before));

const stage = actions.querySelector('button');
stage.click();
await settle(7000);

out.push('files under 更改 after=' + JSON.stringify([...(group('更改')?.querySelectorAll('.gv-row:not(.gv-dir)') ?? [])].map(r => r.getAttribute('title'))));
out.push('util now staged=' + (dirRow('暂存的更改', 'util') !== undefined));
out.push('counts=' + JSON.stringify([...document.querySelectorAll('.gv-group')].map(g => (g.querySelector('.gv-group-head')?.innerText || '').replace(/\s+/g, ' ').trim())));
return out.join('\n');
