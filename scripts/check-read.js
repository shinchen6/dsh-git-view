const out = [];
out.push('GROUPS ' + JSON.stringify([...document.querySelectorAll('.gv-group-head')].map(h => (h.innerText || '').replace(/\s+/g, ' ').trim())));

const gvRows = () => [...document.querySelectorAll('.gv-row')];
const clickRow = async name => {
  const row = gvRows().find(r => (r.innerText || '').includes(name));
  if (!row) return false;
  row.click();
  await new Promise(r => setTimeout(r, 2500));
  return true;
};
const headBtn = label =>
  [...document.querySelectorAll('.gv-detail-head button')].find(x => (x.innerText || '').trim() === label);
const clickMode = async label => {
  const b = headBtn(label);
  if (!b) return 'NO-BUTTON';
  // Report the state before acting: clicking a disabled button is a silent
  // no-op, and a harness that only checks "did the handler fire" reports a
  // broken feature for a button that was never meant to work.
  if (b.disabled) return 'disabled';
  b.click();
  await new Promise(r => setTimeout(r, 2500));
  return 'clicked';
};

await clickRow('guide.md');
out.push('MODES ' + JSON.stringify([...document.querySelectorAll('.gv-detail-head button')].map(b => (b.innerText || '').trim())));

// Each mode must actually change what the detail pane holds.
out.push('as-diff   ' + await clickMode('差异') + ' -> ' + JSON.stringify(gvText('.gv-detail').slice(0, 50)));
out.push('as-file   ' + await clickMode('文件') + ' -> ' + JSON.stringify(gvText('.gv-detail').slice(0, 50)));
out.push('md strong=' + document.querySelectorAll('.gv-detail strong, .gv-detail b').length + ' li=' + document.querySelectorAll('.gv-detail li').length + ' pre=' + document.querySelectorAll('.gv-detail pre, .gv-detail code').length);
out.push('detail children=' + JSON.stringify([...document.querySelector('.gv-detail').children].map(c => c.tagName + '.' + String(c.className || '').slice(0, 24))));

// Source preview for a plain-text code file.
await clickRow('config.json');
out.push('as-file   ' + await clickMode('文件') + ' -> ' + JSON.stringify(gvText('.gv-detail').slice(0, 70)));

// An image previews as an image element, not as text.
await clickRow('img.png');
await clickMode('文件');
const im = document.querySelector('.gv-detail img');
out.push('img tag=' + (im ? 'src=' + String(im.getAttribute('src')).slice(0, 22) + ' len=' + String(im.getAttribute('src')).length : 'NONE'));

// Edit is only offered where it can work: a text file in the working tree.
const editState = async name => {
  await clickRow(name);
  const b = headBtn('编辑');
  return b ? (b.disabled ? 'disabled' : 'enabled') : 'absent';
};
out.push('EDIT staged json=' + await editState('config.json'));
out.push('EDIT staged date=' + await editState('date.js'));
out.push('EDIT binary img=' + await editState('img.png'));
out.push('EDIT staged md=' + await editState('guide.md'));

const remote = [...document.querySelectorAll('.gv-remote button')];
out.push('REMOTE ' + JSON.stringify(remote.map(b => (b.getAttribute('aria-label') || '?') + (b.disabled ? ' off(' + (b.title || '') + ')' : ' ON'))));

const before = gvRows().length;
document.querySelector('.gv-group-head').click();
await new Promise(r => setTimeout(r, 700));
const mid = gvRows().length;
document.querySelector('.gv-group-head').click();
await new Promise(r => setTimeout(r, 700));
out.push('COLLAPSE ' + before + ' -> ' + mid + ' -> ' + gvRows().length);

return out.join('\n');