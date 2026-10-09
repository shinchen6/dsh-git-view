let sid;
const seen = [];
const real = window.fetch;
window.fetch = function patched(url, ...rest) {
  const raw = String(url && url.url ? url.url : url);
  const found = raw.match(/sessionId=([^&]+)/);
  if (found) seen.push(found[1]);
  return real.call(this, url, ...rest);
};
const refresh = [...document.querySelectorAll('.gv-head button')].find(b => (b.innerText || '').includes('刷新'));
if (refresh) refresh.click();
await new Promise(r => setTimeout(r, 3500));
window.fetch = real;
sid = seen[0];

const out = ['sid=' + (sid ? 'ok' : 'NONE')];
const probe = async (path, side) => {
  const res = await real(`/api/git.file?sessionId=${sid}&path=${encodeURIComponent(path)}&side=${side}`);
  const body = await res.json().catch(() => null);
  return `${side} ${path} -> ${res.status} kind=${body?.kind} url=${String(body?.dataUrl ?? '').slice(0, 28)}`;
};

out.push(await probe('t/img.png', 'worktree'));
out.push(await probe('t/img.png', 'staged'));
out.push(await probe('t/api/users.js', 'staged'));
out.push('header=' + gvText('.gv-head').slice(0, 60));
return out.join('\n');