/**
 * Authenticated reads of one repository's current state.
 * A refusal carries its status so the view can tell "not a repository" apart
 * from "this failed and may succeed later".
 */

import { tOr } from './i18n.js';

const NO_STORE = { cache: 'no-store' };

/**
 * One GET against a git route.
 * @param {string} path - Route path below `/api`.
 * @param {Record<string, string>} params - Query parameters.
 * @param {AbortSignal} signal - cancellation.
 * @returns {Promise<any>} the decoded answer.
 * @throws {GitError} carrying the status and git's own message.
 */
async function get(path, params, signal) {
  const query = new URLSearchParams(params);
  const response = await fetch(`${path}?${query}`, { ...NO_STORE, signal });
  const text = await response.text();
  if (!response.ok) throw new GitError(text || `${response.status}`, response.status);
  try {
    return JSON.parse(text);
  } catch {
    throw new GitError(text, response.status);
  }
}

/**
 * A route refusal, keeping git's message for the view to show.
 * The Host sends `{ message, detail }` when it has translated a git failure.
 */
export class GitError extends Error {
  /**
   * @param {string} message - git's own message, or the status text.
   * @param {number} status - HTTP status.
   */
  constructor(message, status) {
    super(message);
    this.name = 'GitError';
    this.status = status;
  }
}

/** Branch facts and the working-tree file groups. */
export const readStatus = (sessionId, signal) => get('/api/git.status', { sessionId }, signal);

/** One file's comparison on the requested side. */
export const readDiff = (sessionId, path, side, signal) =>
  get('/api/git.diff', { sessionId, path, side }, signal);

/**
 * What is inside one untracked directory.
 * Scoped to that directory, so the cost is that directory rather than the
 * repository; this is how the closed directory is opened.
 */
export const readUntracked = (sessionId, dir, signal) =>
  get('/api/git.untracked', { sessionId, dir }, signal);

/** One file's complete content on the requested side. */
export const readFile = (sessionId, path, side, signal) =>
  get('/api/git.file', { sessionId, path, side }, signal);

/**
 * Save one working-tree file.
 * `version` is the token the read returned: passing it makes the save refuse
 * rather than overwrite when the file moved under the editor.
 * @param {string} sessionId - the session whose working directory is addressed.
 * @param {string} path - repository-relative path.
 * @param {string} content - the full new file content.
 * @param {string | undefined} version - the version the text was read at.
 * @returns {Promise<any>} the new version, or the message it refused with.
 */
export async function writeFile(sessionId, path, content, version) {
  const response = await fetch(`/api/git.write?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    ...NO_STORE,
    body: JSON.stringify({ path, text: content, ...(version === undefined ? {} : { version }) }),
  });
  const text = await response.text();
  if (!response.ok) throw new GitError(text || `${response.status}`, response.status);
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true };
  }
}

/** Local branches and their remote-tracking branches. */
export const readBranches = (sessionId, signal) => get('/api/git.branches', { sessionId }, signal);

/** The repository's stash list. */
export const readStashes = (sessionId, signal) => get('/api/git.stashes', { sessionId }, signal);

/**
 * Run one repository action.
 * Only ever called from an explicit click; nothing here runs on a timer.
 * @param {string} sessionId - the session whose working directory is addressed.
 * @param {object} body - the action body.
 * @param {AbortSignal} [signal] - cancellation, so a call that waits on a model
 *   can be bounded instead of hanging until the tab closes.
 * @returns {Promise<any>} git's own answer, or the message it refused with.
 */
export async function postAction(sessionId, body, signal) {
  const response = await fetch(`/api/git.action?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    ...NO_STORE,
    ...(signal === undefined ? {} : { signal }),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new GitError(...refusal(text, response.status));
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true };
  }
}

/**
 * Read a refusal, whether it arrived as JSON or as plain text.
 * The Host names the situation rather than writing a sentence, so this is what
 * translates it; git's own wording stays underneath as `detail`, and is the
 * fallback when a code has no translation yet.
 * @param {string} text - the response body.
 * @param {number} status - the HTTP status.
 * @returns {[string, number]} the message and status for {@link GitError}.
 * @public exported for the copy test, which cannot reach a running Host.
 */
export function refusal(text, status) {
  try {
    const parsed = JSON.parse(text);
    const known = typeof parsed?.code === 'string' ? tOr(`refuse.${parsed.code}`, undefined) : undefined;
    const message = known ?? (typeof parsed?.message === 'string' ? parsed.message : undefined);
    if (message !== undefined) {
      return [parsed.detail === undefined || parsed.detail === '' ? message : `${message}\n${parsed.detail}`, status];
    }
  } catch {
    // A plain-text refusal is already a sentence; fall through to it.
  }
  return [text || `${status}`, status];
}