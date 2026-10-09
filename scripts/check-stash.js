const out = [];
const settle = async (ms = 3500) => { await new Promise(r => setTimeout(r, ms)); };
// Portals are position:fixed, so offsetParent is null on them and filtering on
// it reports every open menu as closed.
const menus = () => [...document.querySelectorAll('[role=menu]')].filter(m => m.getClientRects().length > 0);
const menuRows = () => menus().flatMap(m => [...m.querySelectorAll('.gv-menu-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
const groups = () => [...document.querySelectorAll('.gv-group-head')].map(h => (h.innerText || '').replace(/\s+/g, ' ').trim());
const headBtn = text => [...document.querySelectorAll('.gv-head button')].find(b => (b.innerText || '').includes(text));
const closeMenu = async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await settle(1500); };

out.push('groups before=' + JSON.stringify(groups()));
headBtn('贮藏').click();
await settle(3000);
out.push('stash menu=' + JSON.stringify(menuRows()));
out.push('stash notes=' + JSON.stringify(menus().flatMap(m => [...m.querySelectorAll('.gv-menu-note, .gv-menu-group')].map(n => n.innerText.trim()))));

const push = menus().flatMap(m => [...m.querySelectorAll('.gv-menu-row')]).find(r => /贮藏当前|贮藏全部|贮藏已跟踪/.test(r.innerText));
out.push('push row=' + (push ? JSON.stringify(push.innerText.trim()) : 'MISSING'));
if (!push) return out.join('\n');

push.click();
await settle(2500);
const dialogs = [...document.querySelectorAll('body > div')].filter(d => /贮藏|放弃|确定|取消/.test(d.innerText || '') && d.getClientRects().length > 0 && d.querySelectorAll('button').length <= 4);
const confirmBtn = dialogs.length ? [...dialogs[0].querySelectorAll('button')].find(b => /^贮藏|确定|确认/.test((b.innerText || '').trim())) : undefined;
out.push('confirm=' + (confirmBtn ? confirmBtn.innerText.trim() : 'NONE (applied directly)'));
if (confirmBtn) { confirmBtn.click(); await settle(4000); }

headBtn('刷新').click();
await settle(5000);
out.push('groups after push=' + JSON.stringify(groups()));

headBtn('贮藏').click();
await settle(3000);
out.push('stash menu now=' + JSON.stringify(menuRows()));
out.push('stash notes now=' + JSON.stringify(menus().flatMap(m => [...m.querySelectorAll('.gv-menu-note, .gv-menu-group')].map(n => n.innerText.trim()))));
return out.join('\n');