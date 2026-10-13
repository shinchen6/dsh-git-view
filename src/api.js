/**
 * Authenticated reads of one repository's current state.
 * A refusal carries its status so the view can tell "not a repository" apart
 * from "this failed and may succeed later".
 */

import { tOr } from './i18n.js';

const NO_STORE = { cache: 'no-store' };

/**
 * Query parameters naming the session and, when the view has moved to another
 * project, that project. Leaving `repo` out asks for the repository enclosing
 * the working directory, which is the one the panel opens on.
 *
 * @param {string} sessionId - the session whose working directory is addressed.
 * @param {string | undefined} repo - absolute path of the project being read.
 * @returns {Record<string, string>} the parameters.
 */
const scope = (sessionId, repo) => (repo === undefined ? { sessionId } : { sessionId, repo });

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
export const readStatus = (sessionId, repo, signal) => get('/api/git.status', scope(sessionId, repo), signal);

/**
 * Every repository this session may point at, by name.
 *
 * Answered from a filesystem scan alone, so the panel can list its projects
 * without waiting on a single git process. `fresh` asks for the workspace to be
 * walked again rather than read from the scan already in hand — which is what
 * an explicit refresh means, and what mounting the panel does not.
 *
 * @param {string} sessionId - the session whose working directory to scan.
 * @param {boolean} fresh - rescan instead of reusing the last scan.
 * @param {AbortSignal} signal - cancellation.
 * @returns {Promise<{ cwd: string, projects: object[], truncated: boolean }>} the projects.
 */
export const readRepositories = (sessionId, fresh, signal) =>
  get('/api/git.repositories', fresh ? { sessionId, fresh: '1' } : { sessionId }, signal);

/**
 * How much is waiting in each of them.
 *
 * Separate from the list because on a wide working directory these take
 * seconds, and every project is already on screen by then.
 */
export const readSummaries = (sessionId, signal) => get('/api/git.summaries', { sessionId }, signal);

/** One file's comparison on the requested side. */
export const readDiff = (sessionId, path, side, repo, signal) =>
  get('/api/git.diff', { ...scope(sessionId, repo), path, side }, signal);

/**
 * What is inside one untracked directory.
 * Scoped to that directory, so the cost is that directory rather than the
 * repository; this is how the closed directory is opened.
 */
export const readUntracked = (sessionId, dir, repo, signal) =>
  get('/api/git.untracked', { ...scope(sessionId, repo), dir }, signal);

/** One file's complete content on the requested side. */
export const readFile = (sessionId, path, side, repo, signal) =>
  get('/api/git.file', { ...scope(sessionId, repo), path, side }, signal);

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
export async function writeFile(sessionId, path, content, version, repo) {
  const response = await fetch(`/api/git.write?${new URLSearchParams(scope(sessionId, repo))}`, {
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
export const readBranches = (sessionId, repo, signal) => get('/api/git.branches', scope(sessionId, repo), signal);

/** The repository's stash list. */
export const readStashes = (sessionId, repo, signal) => get('/api/git.stashes', scope(sessionId, repo), signal);

/**
 * Run one repository action.
 * Only ever called from an explicit click; nothing here runs on a timer.
 * @param {string} sessionId - the session whose working directory is addressed.
 * @param {object} body - the action body.
 * @param {AbortSignal} [signal] - cancellation, so a call that waits on a model
 *   can be bounded instead of hanging until the tab closes.
 * @returns {Promise<any>} git's own answer, or the message it refused with.
 */
export async function postAction(sessionId, body, repo, signal) {
  const response = await fetch(`/api/git.action?${new URLSearchParams(scope(sessionId, repo))}`, {
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