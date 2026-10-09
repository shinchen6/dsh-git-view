const out = [];
const settle = async (ms = 1000) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 30 && !document.querySelector('.gv-group-head'); i += 1) await settle(1000);

const buttons = root => [...root.querySelectorAll('button')].map(b => ({
  text: (b.innerText || '').replace(/\s+/g, ' ').trim(),
  title: b.getAttribute('title'),
  disabled: b.disabled,
}));

out.push('header=' + JSON.stringify(buttons(document.querySelector('.gv-head'))));
out.push('commit bar=' + JSON.stringify(buttons(document.querySelector('.gv-commit'))));

// With no remote the two remote controls must be off and must say why — a grey
// button with a tooltip is the difference between "broken" and "nothing to
// push to yet".
const remote = buttons(document.querySelector('.gv-head')).filter(b => /拉取|同步/.test(b.text));
out.push('remote disabled with a reason=' + JSON.stringify(remote.every(b => b.disabled && b.title === '这个仓库没有配置远程')));
const push = [...document.querySelectorAll('.gv-commit button')].find(b => /推送/.test(b.innerText || ''));
out.push('push button=' + JSON.stringify({ text: push.innerText.replace(/\s+/g, ' ').trim(), title: push.getAttribute('title'), disabled: push.disabled }));
out.push('commit still independent=' + JSON.stringify(
  [...document.querySelectorAll('.gv-commit button')].find(b => /提交/.test(b.innerText || '')).disabled) + ' (true: nothing staged is a separate reason)');
return out.join('\n');
