import { NS } from './locales.js';

/**
 * The bound translator, or the key itself before the plugin has applied.
 * `ctx.locale.bind` re-reads the active language on every call, so holding it
 * for the plugin's life makes a language change show without re-registering.
 */
let translate = key => key;

/**
 * Bind this namespace to the client locale service.
 * @param {object} ctx - client context carrying the locale service.
 */
export function bindLocale(ctx) {
  translate = ctx.locale.bind(NS);
}

/**
 * Read one localized string, optionally with its placeholders filled in.
 * The bound translator substitutes nothing, so a missing argument would render
 * as a literal `{n}`; filling them here is the only place that can go wrong.
 * @param {string} key - dictionary key.
 * @param {Record<string, string | number>} [values] - replacements for `{name}`.
 * @returns {string} the string in the active language.
 */
export function t(key, values) {
  const text = translate(key);
  if (values === undefined) return text;
  return Object.entries(values).reduce(
    (out, [name, value]) => out.split(`{${name}}`).join(String(value)),
    text,
  );
}

/**
 * A localized string, or the caller's own fallback when there is no entry.
 * The bound translator returns the key when it does not know it, which is wrong
 * for text replacing a server message: the server's own sentence is the fallback.
 * @param {string} key - dictionary key.
 * @param {string | undefined} fallback - what to use when the key is unknown.
 * @returns {string} the string in the active language, or the fallback.
 */
export function tOr(key, fallback) {
  const text = translate(key);
  return text === key ? fallback : text;
}