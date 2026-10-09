const out = [];
const settle = async (ms = 1000) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 30 && !document.querySelector('.gv-group-head'); i += 1) await settle(1000);

// The scopes first, now that the answer survives a round trip.
const row = [...document.querySelectorAll('.gv-row')].find(r => (r.innerText || '').includes('users.js'));
row.click();
await settle(3000);

const lines = () => [...document.querySelectorAll('.gv-line')];
const scopeButton = label => [...document.querySelectorAll('.gv-detail-head button')]
  .find(b => (b.innerText || '').replace(/\s+/g, ' ').trim() === label);

out.push('default scope=' + JSON.stringify(localStorage.getItem('dsh-git-view:scope')));
out.push('whole: lines=' + lines().length + ' highlighted=' + JSON.stringify(lines().filter(l => l.className.includes('add')).map(l => l.querySelectorAll('.gv-no')[1].textContent)) + ' markers=' + document.querySelectorAll('.gv-dropped').length);

scopeButton('只看变动').click();
await settle(1000);
out.push('changes: lines=' + lines().length + ' hunk=' + document.querySelectorAll('.gv-hunk').length);

scopeButton('整个文件').click();
await settle(1000);
out.push('back to whole: lines=' + lines().length + ' (must not refetch: no skeleton)');
out.push('skeleton while switching=' + (document.querySelector('.gv-sk') !== null));

// The commit bar, including whether 生成 still answers.
const commitBtn = label => [...document.querySelectorAll('.gv-commit button')]
  .find(b => (b.innerText || '').replace(/\s+/g, ' ').trim().replace(/^[✓↑✨]\s*/, '') === label);
const generate = commitBtn('生成');
out.push('generate found=' + (generate !== undefined) + ' disabled=' + generate?.disabled);
out.push('generate title=' + JSON.stringify(generate?.getAttribute('title')));
generate.click();
await settle(1500);
out.push('note during generate=' + JSON.stringify(gvText('.gv-commit-note')));
out.push('generate label during=' + JSON.stringify(generate.innerText.replace(/\s+/g, ' ').trim()));
await settle(25000);
out.push('message after generate=' + JSON.stringify(String(document.querySelector('.gv-commit textarea').value).slice(0, 90)));
out.push('commit enabled after generate=' + !commitBtn('提交').disabled);
out.push('note after=' + JSON.stringify(gvText('.gv-commit-note')));
return out.join('\n');