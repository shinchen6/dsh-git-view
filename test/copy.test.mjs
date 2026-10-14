// Every key the client asks for must exist in both dictionaries, and no
// user-facing sentence may be written directly in English in the source.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src');
const files = readdirSync(srcDir).filter(name => /\.(js|jsx)$/.test(name));

const locales = readFileSync(join(srcDir, 'locales.js'), 'utf8');
const zhBlock = locales.slice(0, locales.indexOf('export const en'));
const enBlock = locales.slice(locales.indexOf('export const en'));

const keysIn = block => new Set([...block.matchAll(/^\s*'([^']+)':/gm)].map(m => m[1]));
const zh = keysIn(zhBlock);
const en = keysIn(enBlock);

let failures = 0;
const fail = message => {
  failures += 1;
  process.stdout.write(`  FAIL  ${message}\n`);
};
const check = (name, fn) => {
  try {
    fn();
    process.stdout.write(`  ok  ${name}\n`);
  } catch (error) {
    fail(`${name} — ${error.message}`);
  }
};

const used = new Map();
for (const name of files) {
  const text = readFileSync(join(srcDir, name), 'utf8');
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const match of code.matchAll(/\bt\(\s*'([^']+)'/g)) {
    if (!used.has(match[1])) used.set(match[1], []);
    used.get(match[1]).push(name);
  }
  // Keys reached through a template, e.g. t(`refuse.${code}`).
  for (const match of code.matchAll(/\bt(?:Or)?\(\s*`([^`$]*)\$\{/g)) {
    const prefix = match[1];
    if (![...zh].some(key => key.startsWith(prefix))) fail(`${name}: no key starts with "${prefix}"`);
  }
}

check('every key used in the source is in the Chinese dictionary', () => {
  const missing = [...used.keys()].filter(key => !zh.has(key));
  if (missing.length > 0) throw new Error(`missing zh: ${missing.join(', ')}`);
});

check('every key used in the source is in the English dictionary', () => {
  const missing = [...used.keys()].filter(key => !en.has(key));
  if (missing.length > 0) throw new Error(`missing en: ${missing.join(', ')}`);
});

check('the two dictionaries define the same keys', () => {
  const onlyZh = [...zh].filter(key => !en.has(key));
  const onlyEn = [...en].filter(key => !zh.has(key));
  if (onlyZh.length > 0 || onlyEn.length > 0) {
    throw new Error(`zh-only: ${onlyZh.join(', ')} | en-only: ${onlyEn.join(', ')}`);
  }
});

// A refusal is the one place the Host writes the sentence, so a code with no
// translation would reach the user in English. Those codes are named here.
check('every refusal code the Host can send has a translation', () => {
  const host = readFileSync(join(srcDir, '..', 'index.js'), 'utf8');
  const codes = new Set([...host.matchAll(/code:\s*'([^']+)'/g)].map(m => m[1]));
  if (codes.size === 0) throw new Error('no refusal codes found in index.js — has the shape changed?');
  const missing = [...codes].filter(code => !zh.has(`refuse.${code}`));
  if (missing.length > 0) throw new Error(`no zh string for: ${missing.join(', ')}`);
});

// Text sitting between tags in Latin script is almost always a leaked literal.
check('no English sentence is written directly into the markup', () => {
  const leaked = [];
  for (const name of files) {
    const text = readFileSync(join(srcDir, name), 'utf8');
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const match of code.matchAll(/>([^<>{}\n]{3,})</g)) {
      const inner = match[1].trim();
      if (inner === '') continue;
      // Punctuation and symbols only, or a placeholder shape such as `+{n}`.
      if (!/[A-Za-z]/.test(inner)) continue;
      if (/^[A-Za-z]:\\/.test(inner)) continue;
      // `>` and `<` are also comparison operators, so a JavaScript expression
      // between two of them looks exactly like a text node here. Anything
      // carrying code punctuation is not copy.
      if (/[=;&(){}[\]|!?]|&&|\|\|/.test(inner)) continue;
      if (/^[A-Z_]{2,}$/.test(inner)) continue;
      leaked.push(`${name}: "${inner}"`);
    }
  }
  if (leaked.length > 0) throw new Error(`untranslated markup: ${leaked.join(' | ')}`);
});

// A project row summarises one of the groups below it, and the two are read
// together — the row says how much is waiting, the group says what kind. The
// unstaged count once read 已暂存 ("staged"), which named the opposite group
// from the one it counted, so the row and the section it stood for disagreed.
check('each project count names its own group and not another one', () => {
  const valueIn = (block, key) => {
    const match = new RegExp(`^\\s*'${key.replace('.', '\\.')}':\\s*'([^']*)'`, 'm').exec(block);
    if (match === null) throw new Error(`no value for ${key} — has the shape changed?`);
    return match[1];
  };
  // `unstaged` contains `staged` as a substring, so the English side is matched
  // on word boundaries rather than by substring.
  const cases = [
    ['projects.stagedCount', '已暂存', /\bstaged\b/],
    ['projects.unstagedCount', '未暂存', /\bunstaged\b/],
    ['projects.untrackedCount', '未跟踪', /\buntracked\b/],
  ];
  for (const [key, chinese, english] of cases) {
    const zhValue = valueIn(zhBlock, key);
    const enValue = valueIn(enBlock, key);
    if (!zhValue.includes(chinese)) throw new Error(`${key} (zh) does not say "${chinese}": ${zhValue}`);
    if (!english.test(enValue)) throw new Error(`${key} (en) does not name its own group: ${enValue}`);
    // No count may carry another group's word: 未暂存 and 已暂存 share 暂存 but
    // each contains only its own full marker, so a full-marker test is exact.
    for (const [otherKey, otherChinese] of cases) {
      if (otherKey !== key && zhValue.includes(otherChinese)) {
        throw new Error(`${key} (zh) also claims ${otherKey}'s "${otherChinese}": ${zhValue}`);
      }
    }
  }
  // And the three must not be the same string wearing three keys.
  const distinct = new Set(cases.map(([key]) => valueIn(zhBlock, key)));
  if (distinct.size !== cases.length) throw new Error(`the three counts are not distinct: ${[...distinct].join(' / ')}`);
});

process.stdout.write(failures === 0 ? '\nall copy checks passed\n' : `\n${failures} copy check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
