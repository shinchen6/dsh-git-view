const out = [];
const settle = async (ms = 800) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 30 && !document.querySelector('.gv-group-head'); i += 1) await settle(1000);

// The diff route is stalled, so clicking a row leaves the detail pane in its
// loading state. This is the wait a user hits most often.
const row = [...document.querySelectorAll('.gv-row')].find(r => (r.innerText || '').includes('users.js'));
row.click();
await settle(700);

out.push('diff skeleton on screen=' + (document.querySelector('.gv-sk-file,.gv-sk') !== null));
out.push('skeleton lines=' + document.querySelectorAll('.gv-sk-line').length);
out.push('hunk bar=' + document.querySelectorAll('.gv-sk-hunk').length);
out.push('old ellipsis note gone=' + ([...document.querySelectorAll('.gv-detail .gv-note')].every(n => (n.innerText || '').trim() !== '…')));
out.push('detail header present=' + (document.querySelector('.gv-detail-head') !== null));
out.push('announce=' + JSON.stringify(document.querySelector('.gv-sk-announce')?.textContent ?? '<absent>'));
return out.join('\n');
