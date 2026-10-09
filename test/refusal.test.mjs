// A refusal is the only place the Host still writes the sentence, so it is the
// only place English can reach a Chinese panel. The Host now names the
// situation instead, and these checks pin the translation down — the browser
// cannot show this until the profile reloads the Host module, so it is tested
// here instead of being left unverified.
import { bindLocale, t } from '../src/i18n.js';
import { zh } from '../src/locales.js';
import { refusal } from '../src/api.js';

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    process.stdout.write(`  ok  ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stdout.write(`  FAIL  ${name} — ${error.message}\n`);
  }
};
const eq = (actual, expected, what) => {
  if (actual !== expected) throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

// Bind the real dictionary rather than a stub, so a key that is only in the
// English block fails here too.
bindLocale({ locale: { bind: () => key => zh[key] ?? key } });

check('a coded refusal is translated, not passed through in English', () => {
  const body = JSON.stringify({ code: 'staleRow', message: 'That file is no longer in the state this row described. Refresh and try again.', detail: 'error: pathspec did not match' });
  const [message, status] = refusal(body, 409);
  eq(status, 409, 'status');
  const [first] = message.split('\n');
  eq(first, '这个文件已经不在该行所说的状态里了，刷新后再试。', 'the sentence');
  if (/no longer in the state/.test(message)) throw new Error('the English sentence still reached the user');
});

check("git's own wording is still carried underneath", () => {
  const body = JSON.stringify({ code: 'newFile', message: 'English fallback.', detail: 'fatal: ambiguous argument' });
  const [message] = refusal(body, 409);
  eq(message.split('\n')[1], 'fatal: ambiguous argument', 'the detail line');
});

check('an unknown code falls back to the server sentence, not to the key', () => {
  const body = JSON.stringify({ code: 'somethingNew', message: 'Server sentence.', detail: 'raw' });
  const [message] = refusal(body, 409);
  eq(message.split('\n')[0], 'Server sentence.', 'the fallback');
  if (/refuse\.somethingNew/.test(message)) throw new Error('the raw key was shown to the user');
});

check('a body with no code still shows the server sentence', () => {
  const [message] = refusal(JSON.stringify({ message: 'Raw failure.', detail: 'boom' }), 409);
  eq(message, 'Raw failure.\nboom', 'message');
});

check('a plain-text refusal is passed through unchanged', () => {
  const [message, status] = refusal('fatal: not a git repository', 409);
  eq(message, 'fatal: not a git repository', 'message');
  eq(status, 409, 'status');
});

check('an empty body falls back to the status code', () => {
  const [message] = refusal('', 500);
  eq(message, '500', 'message');
});

check('every refusal the Host can send renders without the key leaking', () => {
  for (const code of ['staleRow', 'newFile', 'pullFailed', 'pushFailed']) {
    const [message] = refusal(JSON.stringify({ code, message: 'x', detail: 'y' }), 409);
    if (message.startsWith('refuse.')) throw new Error(`${code} rendered as a key`);
    if (t(`refuse.${code}`) === `refuse.${code}`) throw new Error(`${code} has no Chinese string`);
  }
});

process.stdout.write(failures === 0 ? '\nall refusal checks passed\n' : `\n${failures} refusal check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
