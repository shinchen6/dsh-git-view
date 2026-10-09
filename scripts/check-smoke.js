const out = [];
const settle = async (ms = 1000) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 30 && !document.querySelector('.gv-group-head'); i += 1) await settle(1000);

const row = name => [...document.querySelectorAll('.gv-row')].find(r => (r.innerText || '').includes(name));
const mode = label => [...document.querySelectorAll('.gv-detail-head button')].find(b => (b.innerText || '').trim() === label);

// A staged row is index-side: there is no worktree file to write back, so the
// editor must be offered but refused rather than silently missing.
row('users.js').click();
await settle(2500);
out.push('staged file: 编辑 disabled=' + mode('编辑').disabled + ' title=' + JSON.stringify(mode('编辑').getAttribute('title')));
out.push('staged file: 文件 disabled=' + mode('文件').disabled);

// The unstaged row is the one that can be edited.
row('date.js').click();
await settle(2500);
out.push('unstaged file: 编辑 disabled=' + mode('编辑').disabled);
mode('编辑').click();
await settle(2500);
const area = document.querySelector('.gv-editor-area');
out.push('editor opened=' + (area !== null));
out.push('editor content length=' + (area ? area.value.length : '<absent>'));
out.push('editor first line=' + JSON.stringify(area ? area.value.split('\n')[0] : ''));
out.push('editor dirty note=' + JSON.stringify((document.querySelector('.gv-editor-bar .gv-note-inline,.gv-editor-bar .gv-dirty') || {}).innerText ?? '<absent>'));
out.push('editor save button=' + JSON.stringify((document.querySelector('.gv-editor-bar button') || {}).innerText ?? '<absent>'));
out.push('editor save disabled when clean=' + (document.querySelector('.gv-editor-bar button') || {}).disabled);

mode('文件').click();
await settle(2000);
out.push('file view rendered=' + (document.querySelector('.gv-file') !== null));
out.push('file view line count=' + document.querySelectorAll('.gv-file .gv-line,.gv-file pre,.gv-file code').length);
mode('差异').click();
await settle(1500);
out.push('back to diff=' + (document.querySelector('.gv-hunk') !== null));
return out.join('\n');
