const out = [];
const settle = async (ms = 2500) => { await new Promise(r => setTimeout(r, ms)); };
const wrapFor = name =>
  [...document.querySelectorAll('.gv-row-wrap')].find(w => (w.innerText || '').includes(name));
const headBtn = label =>
  [...document.querySelectorAll('.gv-detail-head button')].find(x => (x.innerText || '').trim() === label);
const groups = () => [...document.querySelectorAll('.gv-group-head')].map(h => (h.innerText || '').replace(/\s+/g, ' ').trim());

out.push('groups=' + JSON.stringify(groups()));

// A file can appear in two groups at once; the staged copy is deliberately not
// editable, so the row under test has to be the one in the unstaged group.
// The chevron and counts are stripped first: the staged heading reads 暂存的更改,
// so a bare 更改 matches it too and the click lands on the staged row.
const changedHead = [...document.querySelectorAll('.gv-group-head')].find(h =>
  (h.innerText || '').replace(/\s+/g, '').replace(/[▾▸]/g, '').startsWith('更改'),
);
// `closest` keeps this inside one group; walking up until rows appear overshoots
// into the whole tree whenever a group nests its rows one level deeper.
const changedGroup = changedHead?.closest('.gv-group');
out.push('changed group=' + (changedGroup ? changedGroup.className : 'NONE'));
const wrap = [...(changedGroup ? changedGroup.querySelectorAll('.gv-row-wrap') : [])].find(w => (w.innerText || '').includes('roles.js'));
out.push('found roles.js=' + !!wrap + ' row=' + JSON.stringify((wrap?.innerText || '').replace(/\s+/g, ' ').trim()));
if (!wrap) return out.join('\n');

wrap.querySelector('.gv-row').click();
await settle();
out.push('detail head=' + JSON.stringify(gvText('.gv-detail-head')));

const edit = headBtn('编辑');
out.push('edit disabled=' + (edit ? edit.disabled : 'ABSENT'));
if (!edit || edit.disabled) return out.join('\n');
edit.click();
await settle(3000);

const area = document.querySelector('.gv-editor textarea') ?? document.querySelector('.gv-editor');
out.push('editor=' + (area ? area.tagName + ' value=' + JSON.stringify(String(area.value ?? '').slice(0, 60)) : 'NONE'));
out.push('editor bar=' + JSON.stringify([...document.querySelectorAll('.gv-editor-bar button')].map(b => (b.innerText || '').trim() + (b.disabled ? '(off)' : ''))));

if (area && area.tagName === 'TEXTAREA') {
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(
    area, "export const ROLE_ADMIN = 'admin';\n");
  area.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(1200);
  const save = [...document.querySelectorAll('.gv-editor-bar button')].find(b => /保存|save/i.test(b.innerText || ''));
  out.push('save disabled=' + (save ? save.disabled : 'ABSENT'));
  if (save && !save.disabled) {
    save.click();
    await settle(4000);
    out.push('editor problem=' + JSON.stringify(gvText('.gv-editor-problem')));
    out.push('banner=' + JSON.stringify(gvText('.gv-banner')));
    out.push('groups after save=' + JSON.stringify(groups()));
  }
}
return out.join('\n');