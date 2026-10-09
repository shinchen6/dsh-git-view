const out = [];
const settle = async (ms = 1000) => { await new Promise(r => setTimeout(r, ms)); };
for (let i = 0; i < 40 && !document.querySelector('.gv-group-head'); i += 1) await settle(1000);
await settle(1500);

const box = s => document.querySelector(s);
const commitBtn = label => [...document.querySelectorAll('.gv-commit-bar button')]
  .find(b => (b.innerText || '').replace(/\s+/g, ' ').trim().replace(/^[✓↑✨…]\s*/, '') === label);

out.push('buttons in the bar=' + JSON.stringify([...document.querySelectorAll('.gv-commit-bar button')].map(b => (b.innerText || '').replace(/\s+/g, ' ').trim())));
out.push('history chevron still present=' + (box('.gv-commit-toggle') !== null));
out.push('history list present=' + (box('.gv-history') !== null));

const expand = box('.gv-commit-expand');
const ta = box('.gv-textarea');
const rect = b => { const r = b.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
out.push('expand title=' + JSON.stringify(expand.getAttribute('title')));
out.push('textarea closed=' + JSON.stringify(rect(ta)));
out.push('expand control=' + JSON.stringify(rect(expand)));
out.push('expand is a 24px square, not a full-width overlay=' + (rect(expand).w === 24 && rect(expand).h === 24));
out.push('expand sits inside the field top right=' + (rect(expand).x + rect(expand).w <= rect(ta).x + rect(ta).w && rect(expand).y - rect(ta).y < 24));
out.push('native resize=' + getComputedStyle(ta).resize);

expand.click();
await settle(700);
const wide = rect(ta);
out.push('textarea open=' + JSON.stringify(wide));
out.push('grew from 60 to ' + wide.h + '=' + (wide.h > 60));
out.push('is-open class=' + document.querySelector('.gv-commit').className.includes('is-open'));
out.push('tree shrank=' + (rect(box('.gv-tree-scroll')).h < 600));
expand.click();
await settle(700);
out.push('back to closed height=' + rect(ta).h);

// The generate button, and every state it can be in.
const gen = commitBtn('生成');
out.push('generate disabled=' + gen.disabled + ' title=' + JSON.stringify(gen.getAttribute('title')));
gen.click();
await settle(1200);
out.push('note=' + JSON.stringify((box('.gv-commit-note') || {}).textContent));
out.push('generate aria-busy=' + gen.getAttribute('aria-busy') + ' label=' + JSON.stringify(gen.innerText.replace(/\s+/g, ' ').trim()));
return out.join('\n');