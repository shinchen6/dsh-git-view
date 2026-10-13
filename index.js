/**
 * Git review, node half: authenticated `/api/git.*` routes over one repository.
 * Git is the only source of truth, and write routes run only from an explicit
 * user action in the browser, never on a timer.
 */
import { join, resolve as resolvePath } from 'node:path';

/**
 * Services required: authenticated routes, session working directories, git
 * execution, and file reads. `llm` and `agentDefaultModel` are read through
 * `ctx.get`, not `inject`, so a profile without them still gets everything else.
 */
export const inject = ['connection', 'sessions', 'subprocess', 'fs'];

/** Authenticated GET route serving branch facts and the working-tree file groups. */
const STATUS_PATH = '/api/git.status';
/** Authenticated GET route listing every repository the session may point at. */
const REPOSITORIES_PATH = '/api/git.repositories';
/** Authenticated GET route serving the contents of one untracked directory. */
const UNTRACKED_PATH = '/api/git.untracked';
/** Authenticated GET route serving one file's comparison on the requested side. */
const DIFF_PATH = '/api/git.diff';
/** Authenticated GET route serving one file's complete content on the requested side. */
const FILE_PATH = '/api/git.file';
/** Authenticated POST route replacing one working-tree file with the browser's text. */
const WRITE_PATH = '/api/git.write';
/** Authenticated GET route serving local branches and their remote-tracking branches. */
const BRANCHES_PATH = '/api/git.branches';
/** Authenticated GET route serving the repository's stash list. */
const STASHES_PATH = '/api/git.stashes';
/** Authenticated POST route running one user-initiated repository action. */
const ACTION_PATH = '/api/git.action';

/** Milliseconds a git child gets to exit after termination starts. */
const TERMINATE_GRACE_MS = 2_000;
/** Retained stderr tail for diagnostics. */
const STDERR_TAIL_BYTES = 16 * 1024;
/** Ceiling on one command's captured stdout. */
const OUTPUT_MAX_BYTES = 8 * 1024 * 1024;
/** Milliseconds one git command may run before the request is abandoned. */
const TIMEOUT_MS = 30_000;
/** Largest file served whole by the file route. */
const FILE_MAX_BYTES = 2 * 1024 * 1024;
/** Largest number of file bytes one inline preview may carry. */
const PREVIEW_MAX_BYTES = 8 * 1024 * 1024;
/** Largest number of files one status answer lists. */
const MAX_FILES = 500;
/** Largest number of rendered diff lines before an answer is refused as oversized. */
const DIFF_MAX_LINES = 20_000;
/** How many unpublished commits a push confirmation will name. */
const OUTGOING_MAX = 50;
/** Largest number of stash entries one answer lists. */
const MAX_STASHES = 50;

/**
 * Repository discovery. The working directory's direct children are the only
 * places a nested repository is looked for, matching how editors scan: one level
 * deep, so a repository buried deeper stays out until something asks for it.
 *
 * Finding them costs no git at all. A directory carrying a `.git` entry is a
 * repository root by definition, so one listing plus one `lstat` per child is
 * the entire scan; whether a candidate actually answers git is settled by the
 * status call that has to happen anyway.
 */
const REPO_SCAN_IGNORED = new Set(['node_modules']);
const REPO_MAX = 50;

/**
 * The shared deadline for asking every candidate. They are asked in parallel and
 * whatever has not answered by then is reported as unknown rather than holding
 * the panel: a partial answer now beats a complete one after the user has given
 * up. The next refresh fills the rest in.
 */
const REPO_SCAN_BUDGET_MS = 2_500;

/** How long a candidate set is reused before the workspace is scanned again. */
const REPO_VALIDATE_TTL_MS = 10_000;

/** The byte text never carries; its presence marks content as binary. */
const NUL = String.fromCharCode(0);

const NO_STORE = { 'cache-control': 'no-store' };

/** A JSON answer, or the status the browser branches on. */
function json(value, status = 200) {
  return Response.json(value, { status, headers: NO_STORE });
}

/** A plain-text refusal; git's own message is the useful part. */
function fail(message, status = 400) {
  return new Response(message, { status });
}

/**
 * Resolve the working directory of the session a request addresses.
 * The client sends a session identity rather than a path, so the browser cannot
 * aim this plugin at an arbitrary directory.
 * @param {object} ctx - Host context carrying the session store.
 * @param {URLSearchParams} query - Request query.
 * @returns {{ cwd: string, sessionId: string } | Response} the working directory, or the refusal.
 */
function resolveSession(ctx, query) {
  const sessionId = query.get('sessionId');
  if (!sessionId) return fail('sessionId is required.');
  const cwd = ctx.sessions.get(sessionId)?.header?.cwd;
  if (!cwd) return fail('This session has no working directory.', 409);
  return { cwd, sessionId };
}

/**
 * Locate the repository enclosing a working directory.
 * A directory outside any repository reports `null`, not an error.
 * @param {GitRunner} git - command runner.
 * @param {string} cwd - absolute session working directory.
 * @param {AbortSignal} signal - cancellation.
 * @returns {Promise<string | null>} the repository root, or null.
 */
async function locateRepository(git, cwd, signal) {
  if (git.executable === null) return null;
  const found = await git.run(['rev-parse', '--show-toplevel'], { cwd, signal });
  if (found.exitCode !== 0) return null;
  const root = found.stdout.trim();
  return root === '' ? null : resolvePath(cwd, root);
}

/**
 * Every repository this session may point at: the one enclosing the working
 * directory, plus those nested directly below it.
 *
 * Paths come back canonical, because this set doubles as the allowlist every
 * other route checks against — comparing these strings is what stops a request
 * from naming a directory the scan never offered.
 *
 * @param {object} ctx - the plugin context.
 * @param {GitRunner} git - command runner.
 * @param {string} cwd - absolute session working directory.
 * @param {AbortSignal} signal - cancellation.
 * @returns {Promise<string[]>} candidate roots, the enclosing one first.
 */
async function discoverRepositories(ctx, git, cwd, signal) {
  // Walking up is the one git call discovery needs: the enclosing repository may
  // be an ancestor, not the working directory itself.
  const enclosing = await locateRepository(git, cwd, signal);
  const roots = enclosing === null ? [resolvePath(cwd, '.')] : [enclosing];

  const base = await ctx.fs.resolve(cwd, { signal });
  if (!base) return roots;

  let entries = [];
  try {
    entries = await ctx.fs.listDir(base, signal);
  } catch {
    // A directory that cannot be listed still offers its own repository.
    return roots;
  }

  const nested = await Promise.all(
    entries
      .filter(entry => entry.type === 'directory' && !REPO_SCAN_IGNORED.has(entry.name))
      .slice(0, REPO_MAX)
      .map(async entry => {
        try {
          // lstat does not follow the final component, so a `.git` symlink is
          // found without being read through.
          const dotGit = await ctx.fs.lstat(join(entry.target.displayPath, '.git'), {}, signal);
          return dotGit === undefined ? null : ctx.fs.processPath(entry.target);
        } catch {
          return null;
        }
      }),
  );

  const seen = new Set(roots);
  for (const path of nested) {
    if (path === null || seen.has(path)) continue;
    seen.add(path);
    roots.push(path);
    if (roots.length >= REPO_MAX) break;
  }
  return roots;
}

/**
 * Compare two absolute paths that may differ in separator style, trailing
 * separator, or letter case.
 * @param {string} a - one absolute path.
 * @param {string} b - another absolute path.
 * @returns {boolean} true when both name the same directory.
 */
export function samePath(a, b) {
  const fold = value => resolvePath(value, '.').replace(/[\\/]+$/, '').toLowerCase();
  return fold(a) === fold(b);
}

/** Candidate sets by working directory, reused briefly between polls. */
const candidateCache = new Map();

/**
 * The candidate set, cached so the per-request allowlist check does not rescan
 * the workspace on every status poll.
 * @param {object} ctx - the plugin context.
 * @param {GitRunner} git - command runner.
 * @param {string} cwd - absolute session working directory.
 * @param {AbortSignal} signal - cancellation.
 * @param {boolean} [force] - rescan instead of reading the cache.
 * @returns {Promise<{ at: number, paths: string[] }>} the candidate roots.
 */
async function candidatesFor(ctx, git, cwd, signal, force = false) {
  const cached = candidateCache.get(cwd);
  if (!force && cached !== undefined && Date.now() - cached.at < REPO_VALIDATE_TTL_MS) return cached;

  const paths = await discoverRepositories(ctx, git, cwd, signal);
  const fresh = { at: Date.now(), paths };
  candidateCache.set(cwd, fresh);
  return fresh;
}

/**
 * Choose the repository a request addresses.
 *
 * Omitting `repo` keeps today's behaviour: the repository enclosing the working
 * directory. Naming one is honoured only when the server itself offered it, so a
 * request cannot reach a directory the browser never saw. A cached set that does
 * not contain the named path is not trusted to reject it — a repository created
 * since the scan must still be reachable — so the scan is repeated once first.
 *
 * @param {object} ctx - the plugin context.
 * @param {GitRunner} git - command runner.
 * @param {string} cwd - absolute session working directory.
 * @param {URLSearchParams} query - the request query.
 * @param {AbortSignal} signal - cancellation.
 * @returns {Promise<string>} the root to operate on.
 */
async function resolveRepository(ctx, git, cwd, query, signal) {
  const requested = query.get('repo');
  let cached = await candidatesFor(ctx, git, cwd, signal);

  if (requested !== null) {
    let chosen = cached.paths.find(path => samePath(path, requested));
    if (chosen === undefined) {
      cached = await candidatesFor(ctx, git, cwd, signal, true);
      chosen = cached.paths.find(path => samePath(path, requested));
    }
    if (chosen !== undefined) return chosen;
  }
  return cached.paths[0];
}

/**
 * Each candidate's summary, all asked in parallel under one shared deadline.
 * @param {GitRunner} git - command runner.
 * @param {string[]} paths - candidate roots.
 * @param {AbortSignal} signal - cancellation.
 * @returns {Promise<{ repos: object[], unknown: string[] }>} summaries and unanswered paths.
 */
async function summariseRepositories(git, paths, signal) {
  const deadline = AbortSignal.timeout(REPO_SCAN_BUDGET_MS);
  const shared = signal === undefined ? deadline : AbortSignal.any([signal, deadline]);

  const settled = await Promise.all(paths.map(async path => {
    try {
      const result = await git.ok(
        ['status', '--porcelain=v2', '-z', '--branch', '--untracked-files=normal'],
        { cwd: path, signal: shared },
      );
      const { branch, entries } = parsePorcelainV2(result.stdout);
      const summary = {
        path,
        name: path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? path,
        branch: branch.name,
        unborn: branch.unborn,
        detached: branch.detached,
        oid: branch.oid,
        ahead: branch.ahead,
        behind: branch.behind,
        staged: entries.filter(entry => entry.staged && !entry.conflict).length,
        unstaged: entries.filter(entry => entry.unstaged && !entry.conflict).length,
        conflicts: entries.filter(entry => entry.conflict).length,
        untracked: entries.filter(entry => entry.status === '?').length,
      };
      summary.clean = summary.staged === 0 && summary.unstaged === 0 &&
        summary.conflicts === 0 && summary.untracked === 0;
      return { path, summary };
    } catch {
      // A candidate that could not answer is a different fact from one with no
      // changes, so it is reported rather than quietly dropped.
      return { path, summary: null };
    }
  }));

  return {
    repos: settled.filter(item => item.summary !== null).map(item => item.summary),
    unknown: settled.filter(item => item.summary === null).map(item => item.path),
  };
}

/** Handle `/api/git.repositories`. */
async function handleRepositories(ctx, git, request) {
  const query = new URL(request.url).searchParams;
  const session = resolveSession(ctx, query);
  if (session instanceof Response) return session;
  if ((await git.resolve(request.signal)) === null) return fail('git is not available on this host.', 503);

  // Forced, not cached: this route exists to report what is there now, and a
  // list a repository just created is missing from is worse than a rescan.
  const paths = (await candidatesFor(ctx, git, session.cwd, request.signal, true)).paths;
  const { repos, unknown } = await summariseRepositories(git, paths, request.signal);

  return json({ cwd: session.cwd, repos, unknown, truncated: paths.length > REPO_MAX });
}

/**
 * Run `git <args>` to completion with scrubbed environment, a timeout, and
 * bounded output.
 */
class GitRunner {
  #executable = undefined;

  /**
   * @param {object} ctx - Host context carrying the subprocess capability.
   */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** The resolved git executable, or null when this host has none. */
  get executable() {
    return this.#executable ?? null;
  }

  /**
   * Locate git once. A host without git reports an unavailable view rather than
   * failing every request.
   * @param {AbortSignal} signal - cancellation.
   * @returns {Promise<string | null>} the canonical executable path, or null.
   */
  async resolve(signal) {
    if (this.#executable !== undefined) return this.#executable;
    try {
      this.#executable = await this.ctx.subprocess.resolveExecutable('git', undefined, signal);
    } catch {
      this.#executable = null;
    }
    return this.#executable;
  }

  /**
   * Run one git command in one directory.
   * @param {string[]} args - git arguments; never shell-interpreted.
   * @param {object} options - working directory, environment, stdin, output cap, cancellation.
   * @returns {Promise<{ exitCode: number|null, stdout: string, stderr: string, truncated: boolean }>}
   * @throws when the command times out or is cancelled.
   */
  async run(args, options) {
    const executable = this.#executable;
    if (executable === null) throw new Error('git is not available on this host.');
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    const handle = this.ctx.subprocess.spawn({
      argv: [executable, ...args],
      cwd: options.cwd,
      stdio: {
        stdin: options.stdin === undefined ? 'ignore' : { data: options.stdin },
        stdout: { maxBytes: options.maxBytes ?? OUTPUT_MAX_BYTES },
        stderr: { maxBytes: STDERR_TAIL_BYTES },
      },
      graceMs: TERMINATE_GRACE_MS,
      signal,
      // The subprocess credential scrub drops ambient GIT_CONFIG_KEY_n entries,
      // so GIT_CONFIG_COUNT=0 is stated rather than inherited.
      env: {
        GIT_CONFIG_COUNT: '0',
        GIT_TERMINAL_PROMPT: '0',
        GIT_OPTIONAL_LOCKS: '0',
        LC_ALL: 'C',
        ...options.env,
      },
    });
    const outcome = await handle.done;
    if (signal.aborted) {
      throw new Error(
        `git ${args.join(' ')} ${timeout.aborted ? `timed out after ${TIMEOUT_MS}ms` : 'was aborted'}`,
      );
    }
    const stdout = handle.collected.stdout?.readFrom(0) ?? { text: '', lossy: false };
    const stderr = handle.collected.stderr?.readFrom(0).text ?? '';
    return { exitCode: outcome.exitCode, stdout: stdout.text, stderr, truncated: stdout.lossy };
  }

  /**
   * Run a command that must succeed.
   * @param {string[]} args - git arguments.
   * @param {object} options - as {@link GitRunner.run}.
   * @returns {Promise<{ stdout: string, stderr: string }>} the collected output.
   * @throws when git fails, reporting its own message.
   */
  async ok(args, options) {
    const result = await this.run(args, options);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `git ${args.join(' ')} exited ${result.exitCode}`);
    }
    return result;
  }
}

/**
 * Branch facts and working-tree entries from `git status --porcelain=v2 -z`.
 * Exported for `test/parsers.test.mjs`; nothing outside this package imports it.
 * @param {string} text - NUL-separated porcelain v2 output.
 * @returns {{ branch: object, entries: object[] }} parsed status.
 */
export function parsePorcelainV2(text) {
  const fields = text.split(NUL);
  const branch = { name: null, oid: null, upstream: null, ahead: 0, behind: 0, detached: false, unborn: false };
  const entries = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field === '') continue;

    if (field.startsWith('# ')) {
      const space = field.indexOf(' ', 2);
      const key = field.slice(2, space);
      const value = field.slice(space + 1);
      // A repository with no commits reports the literal `(initial)`, which is
      // not an object id; naming that an oid would render as a broken commit.
      if (key === 'branch.oid') {
        if (value === '(initial)') branch.unborn = true;
        else branch.oid = value;
      } else if (key === 'branch.head') {
        if (value === '(detached)') branch.detached = true;
        else branch.name = value;
      } else if (key === 'branch.upstream') branch.upstream = value;
      else if (key === 'branch.ab') {
        const match = /\+(\d+) -(\d+)/.exec(value);
        if (match !== null) {
          branch.ahead = Number(match[1]);
          branch.behind = Number(match[2]);
        }
      }
      continue;
    }

    if (field.startsWith('? ')) {
      entries.push({ path: field.slice(2), status: '?', staged: false, unstaged: false, conflict: false });
      continue;
    }
    if (field.startsWith('! ')) continue;

    const kind = field[0];
    // With -z, fixed fields are space-separated and the record ends at NUL, so
    // the path follows the final space. A rename's source is the next field.
    const path = field.slice(field.lastIndexOf(' ') + 1);

    if (kind === 'u') {
      // u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
      entries.push({ path, status: 'U', staged: true, unstaged: true, conflict: true });
      continue;
    }

    if (kind === '1' || kind === '2') {
      if (kind === '2') index += 1;
      const xy = field.split(' ')[1] ?? '..';
      const x = xy[0] === '.' ? '' : xy[0];
      const y = xy[1] === undefined || xy[1] === '.' ? '' : xy[1];
      const conflict = x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D');
      entries.push({
        path,
        status: conflict ? 'U' : x || y || 'M',
        staged: x !== '',
        unstaged: y !== '',
        conflict,
      });
    }
  }
  return { branch, entries };
}

/**
 * Line counts per path from one `git diff --numstat -z` run.
 * @param {string} text - NUL-separated numstat output.
 * @returns {Map<string, { added: number, deleted: number, binary: boolean }>} counts by path.
 */
export function parseNumstat(text) {
  const counts = new Map();
  const fields = text.split(NUL);
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field === '') continue;
    const first = field.indexOf('\t');
    const second = field.indexOf('\t', first + 1);
    if (first < 0 || second < 0) continue;
    const added = field.slice(0, first);
    const deleted = field.slice(first + 1, second);
    const rest = field.slice(second + 1);
    let path = rest;
    if (rest === '') {
      // A rename records two NUL-separated paths after the empty path field.
      path = fields[index + 2] ?? '';
      index += 2;
    }
    if (path === '') continue;
    counts.set(path, {
      added: added === '-' ? 0 : Number(added),
      deleted: deleted === '-' ? 0 : Number(deleted),
      binary: added === '-' || deleted === '-',
    });
  }
  return counts;
}

/**
 * Parse a unified diff into renderable hunks.
 * @param {string} text - `git diff` output.
 * @returns {{ hunks: object[], before: boolean, after: boolean }} the comparison.
 */
export function parseUnifiedDiff(text) {
  const hunks = [];
  let current = null;
  for (const line of text.split('\n')) {
    const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (header !== null) {
      current = {
        oldStart: Number(header[1]),
        oldLines: header[2] === undefined ? 1 : Number(header[2]),
        newStart: Number(header[3]),
        newLines: header[4] === undefined ? 1 : Number(header[4]),
        lines: [],
      };
      hunks.push(current);
      continue;
    }
    if (current === null) continue;
    if (line === '' || line.startsWith('\\') || line.startsWith('diff --git')) continue;
    const prefix = line[0];
    if (prefix !== ' ' && prefix !== '+' && prefix !== '-') continue;
    current.lines.push(line);
  }
  const before = !/^--- \/dev\/null$/m.test(text);
  const after = !/^\+\+\+ \/dev\/null$/m.test(text);
  return { hunks, before, after };
}

/** One synthetic hunk presenting an untracked file as wholly new. */
function syntheticNewFile(text) {
  const lines = text.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return {
    before: false,
    after: true,
    hunks:
      lines.length === 0
        ? []
        : [{ oldStart: 1, oldLines: 0, newStart: 1, newLines: lines.length, lines: lines.map(line => `+${line}`) }],
  };
}

/** Rendered line total across a hunk list. */
function countLines(hunks) {
  return hunks.reduce((total, hunk) => total + hunk.lines.length, 0);
}

/**
 * Read a working-tree file through the composed filesystem.
 * @returns {Promise<{ text: string, binary: boolean } | { oversized: true } | undefined>}
 */
async function readWorktreeFile(ctx, root, path, signal) {
  const target = await ctx.fs.resolve(join(root, path), { signal });
  if (target === undefined) return undefined;
  const info = await ctx.fs.stat(target, signal).catch(() => undefined);
  if (info === undefined || info.type !== 'file') return undefined;
  if (info.size !== undefined && info.size > FILE_MAX_BYTES) return { oversized: true };
  // Bytes, not text: decode is the one step that can fail on a file's contents,
  // and doing it here keeps "this is binary" an answer rather than a refusal.
  const bytes = await ctx.fs.readBytes(target, signal, FILE_MAX_BYTES + 1).catch(() => undefined);
  if (bytes === undefined) return undefined;
  const buffer = Buffer.from(bytes);
  if (buffer.byteLength > FILE_MAX_BYTES) return { oversized: true };
  const text = buffer.toString('utf8');
  // Content that does not survive a decode round trip was never text; showing
  // the replacement characters it decodes into would be worse than saying so.
  const binary = buffer.includes(0) || !Buffer.from(text, 'utf8').equals(buffer);
  return { text, binary, version: info.version };
}

/**
 * The MIME type a previewable file is handed to the browser as.
 * Only kinds a browser renders on its own are listed; `.svg` is deliberately
 * absent, since serving it inline would run repository content on this origin.
 * @param {string} path - repository-relative, slash-separated path.
 * @returns {string | undefined} the MIME type, or undefined for source files.
 */
function inlineKind(path) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const cut = name.lastIndexOf('.');
  if (cut <= 0) return undefined;
  const extension = name.slice(cut + 1).toLowerCase();
  const IMAGE = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    avif: 'image/avif',
    ico: 'image/x-icon',
  };
  if (IMAGE[extension] !== undefined) return IMAGE[extension];
  if (extension === 'pdf') return 'application/pdf';
  return undefined;
}

/**
 * Read a file's raw bytes for an inline preview.
 * The preview ceiling sits well under the edit ceiling.
 * @returns {Promise<string | null | undefined>} base64 bytes, null when oversized,
 *   or undefined when the file is gone.
 */
async function readWorktreeBytes(ctx, root, path, signal) {
  const target = await ctx.fs.resolve(join(root, path), { signal });
  if (target === undefined) return undefined;
  const info = await ctx.fs.stat(target, signal).catch(() => undefined);
  if (info === undefined || info.type !== 'file') return undefined;
  if (info.size !== undefined && info.size > PREVIEW_MAX_BYTES) return null;
  const bytes = await ctx.fs.readBytes(target, signal, PREVIEW_MAX_BYTES + 1).catch(() => undefined);
  if (bytes === undefined) return undefined;
  if (bytes.byteLength > PREVIEW_MAX_BYTES) return null;
  return Buffer.from(bytes).toString('base64');
}

/** The file groups the view renders, with their shared row shape. */
function groupFiles(entries, stagedCounts, unstagedCounts) {
  const conflicts = [];
  const staged = [];
  const unstaged = [];
  const untracked = [];
  let truncated = false;

  for (const entry of entries) {
    if (entry.status === '?') {
      // Porcelain writes an untracked directory with a trailing slash and omits its
      // contents; marking it lets the tree offer to open it.
      const dir = entry.path.endsWith('/');
      untracked.push({
        path: entry.path,
        display: entry.path,
        status: '?',
        added: 0,
        deleted: 0,
        addedAll: true,
        ...(dir ? { dir: true } : {}),
      });
      continue;
    }
    const counts = entry.staged ? stagedCounts : unstagedCounts;
    const measured = counts?.get(entry.path);
    const record = {
      path: entry.path,
      display: entry.path,
      status: entry.status,
      added: measured?.added ?? 0,
      deleted: measured?.deleted ?? 0,
      ...(measured?.binary ? { binary: true } : {}),
    };
    if (entry.conflict) conflicts.push(record);
    else if (entry.staged) staged.push(record);
    if (entry.unstaged && !entry.conflict) unstaged.push(record);
  }

  const counts = {};
  const limit = key => {
    // `total` must be the real count: a truncated list is otherwise
    // indistinguishable from a complete one.
    counts[key] = { listed: Math.min(lists[key].length, MAX_FILES), total: lists[key].length };
    if (lists[key].length <= MAX_FILES) return lists[key];
    truncated = true;
    return lists[key].slice(0, MAX_FILES);
  };
  const lists = { conflicts, staged, unstaged, untracked };

  return {
    conflicts: limit('conflicts'),
    staged: limit('staged'),
    unstaged: limit('unstaged'),
    untracked: limit('untracked'),
    counts,
    truncated,
    total: entries.length,
  };
}

/**
 * Shared prologue: answer the two states the browser renders as empty views.
 *
 * The repository is the one the browser named, when the server offered it in its
 * scan, and otherwise the one enclosing the working directory.
 *
 * @param {object} ctx - the plugin context.
 * @param {GitRunner} git - the repository runner.
 * @param {Request} request - the route request.
 * @returns {Promise<{ root: string, sessionId: string } | Response>} the repository and session, or the refusal.
 */
async function prepare(ctx, git, request) {
  const query = new URL(request.url).searchParams;
  const session = resolveSession(ctx, query);
  if (session instanceof Response) return session;
  if ((await git.resolve(request.signal)) === null) return fail('git is not available on this host.', 503);
  const root = await resolveRepository(ctx, git, session.cwd, query, request.signal);
  if (root === undefined) return fail('Not inside a git repository.', 409);
  return { root, sessionId: session.sessionId };
}

/** Handle `/api/git.status`. */
async function handleStatus(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  const root = ready.root;

  // `-unormal` lists a wholly untracked directory as one entry, which keeps the
  // scan proportional to the repository rather than to its untracked file count.
  const status = await git.ok(['status', '--porcelain=v2', '-z', '--branch', '--untracked-files=normal'], {
    cwd: root,
    signal: request.signal,
  });
  const { branch, entries } = parsePorcelainV2(status.stdout);
  const remotes = await git.run(['remote'], { cwd: root, signal: request.signal });
  const hasRemote = remotes.exitCode === 0 && remotes.stdout.trim() !== '';
  const stagedCounts = parseNumstat((await git.run(['diff', '--numstat', '-z', '--cached'], { cwd: root })).stdout);
  const unstagedCounts = parseNumstat((await git.run(['diff', '--numstat', '-z'], { cwd: root })).stdout);

  return json({
    available: true,
    repo: {
      root,
      name: root.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? root,
      // `branch` names the checked-out branch; `name` above names the directory.
      branch: branch.name,
      oid: branch.oid,
      upstream: branch.upstream,
      ahead: branch.ahead,
      behind: branch.behind,
      detached: branch.detached,
      // Whether any remote exists at all. An upstream says nothing about a branch
      // that has never been pushed, so the panel needs both.
      hasRemote,
      // The commits a push would publish, so the confirmation names what is about
      // to leave the machine.
      ...(await outgoingCommits(git, root, branch, request.signal)),
    },
    ...groupFiles(entries, stagedCounts, unstagedCounts),
    clean: entries.length === 0,
  });
}

/**
 * The commits a push would publish, newest first.
 * A detached head, no upstream, and no commits at all all return an empty list
 * rather than an error.
 * @returns {Promise<{ outgoing: { sha: string, subject: string }[] }>} the list.
 */
async function outgoingCommits(git, root, branch, signal) {
  const empty = { outgoing: [] };
  if (branch.detached || branch.upstream === undefined || branch.upstream === '') return empty;
  // Porcelain names the upstream as `origin/main`, which need not resolve yet —
  // a renamed remote keeps its old tracking entry — so failure here is normal.
  const log = await git.run(
    ['log', '--no-color', `--max-count=${OUTGOING_MAX}`, '--format=%h %s', `${branch.upstream}..HEAD`],
    { cwd: root, signal },
  );
  if (log.exitCode !== 0) return empty;
  const outgoing = log.stdout
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const cut = line.indexOf(' ');
      return { sha: line.slice(0, cut), subject: line.slice(cut + 1) };
    });
  return { outgoing };
}

/** Handle `/api/git.untracked`: what is inside one untracked directory. */
async function handleUntracked(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  const root = ready.root;
  const dir = new URL(request.url).searchParams.get('dir') ?? '';
  // The trailing slash marks a directory and `..` is refused; a bare filename
  // would otherwise buy a scan of the whole repository.
  if (!dir.endsWith('/') || dir.includes('..')) return fail('dir is one untracked directory path.', 400);

  // Scoped to one directory, so the cost is that directory and not the repository.
  const result = await git.run(
    ['status', '--porcelain=v2', '-z', '--untracked-files=all', '--', dir],
    { cwd: root, signal: request.signal },
  );
  if (result.exitCode !== 0) return fail('That directory could not be read.', 409);
  const { entries } = parsePorcelainV2(result.stdout);
  const files = entries
    .filter(entry => entry.status === '?' && !entry.path.endsWith('/'))
    .map(entry => ({
      path: entry.path,
      display: entry.path,
      status: '?',
      added: 0,
      deleted: 0,
      addedAll: true,
    }));
  return json({
    dir,
    files: files.slice(0, MAX_FILES),
    // The number of files here, not the number sent.
    total: files.length,
    truncated: files.length > MAX_FILES,
  });
}

/** Handle `/api/git.diff`. */
async function handleDiff(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  const root = ready.root;
  const query = new URL(request.url).searchParams;
  const path = query.get('path');
  const side = query.get('side') ?? 'unstaged';
  if (!path) return fail('path is required.');
  if (!['staged', 'unstaged', 'untracked'].includes(side)) return fail('side is staged, unstaged, or untracked.');

  if (side === 'untracked') {
    const content = await readWorktreeFile(ctx, root, path, request.signal);
    if (content === undefined) return fail('File unavailable.', 404);
    if (content.oversized) return json({ kind: 'oversized', path, display: path });
    if (content.binary) return json({ kind: 'binary', path, display: path });
    const parsed = syntheticNewFile(content.text);
    if (countLines(parsed.hunks) > DIFF_MAX_LINES) return json({ kind: 'oversized', path, display: path });
    return json({ kind: 'text', path, display: path, ...parsed, coarse: false });
  }

  const result = await git.run(
    ['--no-pager', 'diff', '-U3', ...(side === 'staged' ? ['--cached'] : []), '--', path],
    { cwd: root, signal: request.signal },
  );
  if (result.exitCode !== 0) return fail('Comparison unavailable.', 409);

  const parsed = parseUnifiedDiff(result.stdout);
  if (parsed.hunks.length === 0) {
    const counts = parseNumstat(
      (
        await git.run(['diff', '--numstat', '-z', ...(side === 'staged' ? ['--cached'] : [])], { cwd: root })
      ).stdout,
    );
    if (counts.get(path)?.binary) return json({ kind: 'binary', path, display: path });
  }
  if (countLines(parsed.hunks) > DIFF_MAX_LINES) return json({ kind: 'oversized', path, display: path });
  return json({ kind: 'text', path, display: path, ...parsed, coarse: false });
}

/** Handle `/api/git.file`. */
async function handleFile(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  const root = ready.root;
  const query = new URL(request.url).searchParams;
  const path = query.get('path');
  const side = query.get('side') ?? 'worktree';
  if (!path) return fail('path is required.');
  if (!['staged', 'head', 'worktree'].includes(side)) return fail('side is staged, head, or worktree.');

  if (side === 'worktree') {
    // The inline check comes first on purpose: an image is not decodable as
    // text, so reading text first would answer every image with "file unavailable".
    const inline = inlineKind(path);
    if (inline !== undefined) {
      const encoded = await readWorktreeBytes(ctx, root, path, request.signal);
      if (encoded === undefined) return fail('File unavailable.', 404);
      if (encoded === null) return fail('That file is too large to preview.', 413);
      return json({ kind: 'inline', path, display: path, dataUrl: `data:${inline};base64,${encoded}` });
    }
    const content = await readWorktreeFile(ctx, root, path, request.signal);
    if (content === undefined) return fail('File unavailable.', 404);
    if (content.oversized) return json({ kind: 'oversized', path, display: path });
    return json({
      kind: content.binary ? 'binary' : 'text',
      path,
      display: path,
      ...(content.binary ? {} : { text: content.text }),
      // The version a later save is guarded against; absent means unguarded.
      ...(content.version === undefined ? {} : { version: content.version }),
      eof: true,
    });
  }

  // Bytes come from the filesystem, not the text channel: the collect reader
  // decodes UTF-8, so those bytes would arrive mangled. The text-only diff
  // proves the working-tree copy still holds exactly this side's blob.
  const inline = inlineKind(path);
  if (inline !== undefined) {
    const unchanged = await git.run(
      side === 'staged' ? ['diff', '--quiet', '--', path] : ['diff', '--quiet', '--cached', '--', path],
      { cwd: root, signal: request.signal },
    );
    if (unchanged.exitCode !== 0) return json({ kind: 'binary', path, display: path });
    const encoded = await readWorktreeBytes(ctx, root, path, request.signal);
    if (encoded === undefined) return json({ kind: 'binary', path, display: path });
    if (encoded === null) return json({ kind: 'oversized', path, display: path });
    return json({ kind: 'inline', path, display: path, dataUrl: `data:${inline};base64,${encoded}` });
  }

  const spec = side === 'staged' ? `:${path}` : `HEAD:${path}`;
  const result = await git.run(['--no-pager', 'show', spec], {
    cwd: root,
    signal: request.signal,
    maxBytes: FILE_MAX_BYTES + 1,
  });
  if (result.exitCode !== 0) return fail('File not available on that side.', 404);
  if (result.truncated || Buffer.byteLength(result.stdout, 'utf8') > FILE_MAX_BYTES) {
    return json({ kind: 'oversized', path, display: path });
  }
  if (result.stdout.includes(NUL)) return json({ kind: 'binary', path, display: path });
  return json({ kind: 'text', path, display: path, text: result.stdout, eof: true });
}

/**
 * Handle `/api/git.write`: replace one working-tree file with the browser's text.
 * Only the working tree is writable — the index and HEAD belong to git — and the
 * version read travels with the write, so a conflict leaves the file alone.
 * @param {object} ctx - the plugin context.
 * @param {GitRunner} git - the repository runner.
 * @param {Request} request - the route request.
 * @returns {Promise<Response>} the new version, or the refusal that replaces it.
 */
async function handleWrite(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  if (request.method !== 'POST') return fail('POST is required to write.', 405);
  const body = await request.json().catch(() => undefined);
  if (body === undefined || typeof body !== 'object') return fail('A JSON object body is required.');

  const path = safePath(body.path);
  if (path === undefined) return fail('That path is not one this view may write.');
  if (typeof body.text !== 'string') return fail('text is required.');
  if (Buffer.byteLength(body.text, 'utf8') > FILE_MAX_BYTES) return fail('That file is too large to save.', 413);

  const target = await ctx.fs.resolve(join(ready.root, path), { signal: request.signal });
  if (target === undefined) return fail('File unavailable.', 404);
  const before = await ctx.fs.stat(target, request.signal).catch(() => undefined);
  if (before === undefined || before.type !== 'file') return fail('File unavailable.', 404);
  if (before.size !== undefined && before.size > FILE_MAX_BYTES) return fail('That file is too large to save.', 413);

  let outcome;
  try {
    outcome = await ctx.fs.writeText(
      target,
      body.text,
      // The intent is a tagged union, and only the version arm means "replace
      // exactly what was read". A bare version is not a weaker guard, it is not
      // the guard at all.
      typeof body.version === 'string' ? { kind: 'replaceIfVersion', version: body.version } : undefined,
      request.signal,
      // Left unset, the backend applies its own default root, which is not this
      // repository, and the write is refused as out of bounds.
      { mode: 'workspace-write', workspaceRoot: ready.root, sessionId: ready.sessionId },
    );
  } catch (error) {
    // A stale version is the backend's own report, and it is the one case where
    // the file is still intact: say so instead of writing anyway.
    const report = `${error?.code ?? ''} ${error?.message ?? ''}`;
    if (/STALE_VERSION|stale version/i.test(report)) {
      return fail('This file changed since it was opened. Reopen it and try again.', 409);
    }
    if (/denied|not permitted|sandbox|outside/i.test(report)) {
      return fail(`The sandbox refused this write: ${error.message}`, 403);
    }
    return fail(error?.message ?? 'The file could not be written.', 500);
  }

  return json({ ok: true, path, version: outcome?.version, created: outcome?.created === true });
}

/**
 * Check one path the browser asked git about.
 * Backslashes, drive letters, empty, `.` or `..` segments, and a leading dash
 * are refused, so `--` is not the only guard against a path outside the repository.
 * @param {unknown} value - the requested path.
 * @returns {string | undefined} the accepted path, or undefined.
 */
export function safePath(value) {
  if (typeof value !== 'string' || value === '') return undefined;
  if (value.includes('\\') || value.startsWith('-') || /^[A-Za-z]:/.test(value)) return undefined;
  const parts = value.split('/');
  if (parts.some(part => part === '' || part === '..' || part === '.')) return undefined;
  return parts.join('/');
}

/**
 * Check one list of paths the browser asked git about.
 * @param {unknown} value - the requested paths.
 * @param {number} max - how many the action accepts.
 * @returns {string[] | undefined} the accepted paths, or undefined.
 */
function safePaths(value, max = 500) {
  if (!Array.isArray(value) || value.length === 0 || value.length > max) return undefined;
  const paths = value.map(safePath);
  return paths.some(path => path === undefined) ? undefined : paths;
}

/**
 * The argv for one supported action.
 * Paths always sit behind a literal `--`, and branches and messages are matched
 * against a narrow pattern, so nothing from the request can reach git as a flag.
 * @param {object} body - the decoded request body.
 * @returns {{ args: string[], fallback?: string[] } | undefined} what to run, or undefined when the request is not one of ours.
 */
export function actionCommand(body) {
  const text = value => (typeof value === 'string' ? value : undefined);
  /** Git ref names the browser is allowed to name. */
  const ref = value => (typeof value === 'string' && /^[A-Za-z0-9._\-/]+$/.test(value) ? value : undefined);

  switch (body.action) {
    case 'stage':
    case 'unstage': {
      const paths = safePaths(body.paths);
      if (paths === undefined) return undefined;
      if (body.action === 'stage') return { args: ['add', '--', ...paths] };
      return {
        args: ['restore', '--staged', '--', ...paths],
        // An unborn HEAD has no commit to restore from: empty the index instead.
        fallback: ['rm', '--cached', '-r', '-q', '--', ...paths],
      };
    }
    case 'discard': {
      const paths = safePaths(body.paths) ?? (safePath(body.path) === undefined ? undefined : [safePath(body.path)]);
      if (paths === undefined) return undefined;
      if (body.side === 'staged') return { args: ['restore', '--staged', '--', ...paths] };
      if (body.side === 'untracked') return { args: ['clean', '-f', '--', ...paths] };
      if (body.side === 'unstaged') return { args: ['restore', '--worktree', '--', ...paths] };
      return undefined;
    }
    case 'restore': {
      const paths = safePaths(body.paths) ?? (safePath(body.path) === undefined ? undefined : [safePath(body.path)]);
      if (paths === undefined || body.side !== 'staged') return undefined;
      return { args: ['restore', '--staged', '--worktree', '--', ...paths] };
    }
    case 'commit': {
      const message = text(body.message)?.trim();
      if (message === undefined || message === '') return undefined;
      return { args: ['commit', '-m', message] };
    }
    case 'pull':
      return { args: ['pull', '--ff-only'] };
    case 'push':
      return { args: ['push'] };
    case 'checkout': {
      const branch = ref(body.branch);
      return branch === undefined ? undefined : { args: ['checkout', branch] };
    }
    case 'branch.create': {
      const name = ref(body.name);
      const from = ref(body.from) ?? 'HEAD';
      if (name === undefined || from === undefined) return undefined;
      return { args: ['checkout', '-b', name, from] };
    }
    case 'stash.push': {
      const message = text(body.message)?.trim();
      const args = ['stash', 'push'];
      if (message !== undefined && message !== '') args.push('-m', message);
      if (body.includeUntracked === true) args.push('--include-untracked');
      return { args };
    }
    case 'stash.apply':
    case 'stash.pop': {
      const target = stashRef(body.ref);
      if (target === undefined) return undefined;
      return { args: ['stash', body.action === 'stash.pop' ? 'pop' : 'apply', target] };
    }
    case 'stash.drop': {
      const target = stashRef(body.ref);
      return target === undefined ? undefined : { args: ['stash', 'drop', target] };
    }
    case 'stash.clear':
      return { args: ['stash', 'clear'] };
    default:
      return undefined;
  }
}

/**
 * Accept only a stash reference this plugin itself minted.
 * @param {unknown} value - the requested reference.
 * @returns {string | undefined} the accepted reference, or undefined.
 */
function stashRef(value) {
  if (typeof value !== 'string') return undefined;
  const match = /^stash@\{\d+\}$/.exec(value);
  return match === null ? undefined : value;
}

/** Largest number of diff bytes handed to the model when it writes a commit message. */
const MESSAGE_INPUT_MAX_BYTES = 60_000;
/** Token ceiling for a generated commit message, which is a line or two by design. */
const MESSAGE_MAX_TOKENS = 200;

/**
 * The instruction that turns a diff into a commit message.
 * Conventional Commits, a short subject, and no framing characters: the result
 * goes straight into `git commit -m`.
 */
const COMMIT_MESSAGE_SYSTEM_PROMPT = [
  'Write a git commit message for the staged diff supplied by the user.',
  'Use Conventional Commits: a subject line of the form "type(scope): summary".',
  'Use a past-tense summary under 72 characters. Add a body only when the change needs one, separated by a blank line.',
  'Write in the language of the diff. Return only the message: no quotes, no code fence, no explanation.',
].join('\n');

/**
 * Write one commit message from the staged diff, using the profile's own model.
 * Only text deltas are concatenated; a tool call or reasoning block never
 * becomes part of the message.
 * @param {string} root - the repository working directory.
 * @param {string} sessionId - the session whose model selection is used.
 * @returns {Promise<Response>} the generated message, or the refusal.
 */
async function handleCommitMessage(ctx, git, root, sessionId, signal) {
  const llm = ctx.get('llm');
  const models = ctx.get('agentDefaultModel');
  if (llm === undefined || models === undefined) {
    return fail('No model service is available in this profile.', 501);
  }

  const diff = await git.ok(['diff', '--cached', '--no-color', '--no-ext-diff'], { cwd: root, signal });
  if (diff.stdout.trim() === '') return fail('There is nothing staged to describe.');

  // A diff large enough to blow the context is worse than a truncated one, and
  // the head of a diff carries the shape of the change.
  const framed = diff.stdout.length > MESSAGE_INPUT_MAX_BYTES
    ? `${diff.stdout.slice(0, MESSAGE_INPUT_MAX_BYTES)}\n... diff truncated ...`
    : diff.stdout;

  const selection = models.currentSelection();
  if (selection === undefined) return fail('No model is selected in this profile.');

  const controller = new AbortController();
  signal.addEventListener('abort', () => controller.abort(), { once: true });

  let message = '';
  let failure;
  let truncated = false;
  try {
    for await (const chunk of llm.stream({
      provider: selection.provider,
      model: selection.model,
      messages: [{ role: 'user', content: [{ type: 'text', text: framed }] }],
      system: COMMIT_MESSAGE_SYSTEM_PROMPT,
      maxTokens: MESSAGE_MAX_TOKENS,
      temperature: 0.2,
      sessionId,
      purpose: 'git-commit-message',
      signal: controller.signal,
    })) {
      if (chunk.type === 'text-delta') message += chunk.text;
      if (chunk.type === 'finish') {
        if (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted') {
          failure = chunk.reason.failure?.message ?? 'the model call failed';
        }
        // A message cut at the token ceiling arrives looking like a finished
        // one, so report it rather than letting the last clause stop mid-sentence.
        if (chunk.reason.kind === 'max-tokens') truncated = true;
      }
    }
  } catch (error) {
    if (signal.aborted) throw error;
    return fail(error.message, 502);
  }
  if (failure !== undefined) return fail(failure, 502);

  // Strip exactly one layer of quotes or fence a model may have wrapped the
  // answer in rather than leaving it in.
  const cleaned = message
    .trim()
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/\n?```$/, '')
    .trim();
  if (cleaned === '') return fail('The model produced no text.');

  return json({
    message: cleaned,
    model: selection.model,
    // The caller shows this rather than the view guessing from the text.
    ...(truncated ? { truncated: true } : {}),
    ...(diff.stdout.length > MESSAGE_INPUT_MAX_BYTES ? { diffTruncated: true } : {}),
  });
}

/**
 * Handle `/api/git.action`.
 * @param {object} ctx - the plugin context.
 * @param {GitRunner} git - the repository runner.
 * @param {Request} request - the route request.
 * @returns {Promise<Response>} the action's outcome.
 */
async function handleAction(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  if (request.method !== 'POST') return fail('POST is required for an action.', 405);
  const body = await request.json().catch(() => undefined);
  if (body === undefined || typeof body !== 'object') return fail('A JSON object body is required.');

  // Commit-message generation reads the model rather than git, so it is answered
  // before the command table and never reaches an argv.
  if (body.action === 'generateMessage') {
    return handleCommitMessage(ctx, git, ready.root, ready.sessionId, request.signal);
  }
  if (body.action === 'sync') {
    const pulled = await git.run(['pull', '--ff-only'], { cwd: ready.root, signal: request.signal });
    if (pulled.exitCode !== 0) {
      return json({ code: 'pullFailed', message: 'git pull failed.', detail: pulled.stderr.trim() }, 409);
    }
    const pushed = await git.run(['push'], { cwd: ready.root, signal: request.signal });
    if (pushed.exitCode !== 0) {
      return json({ code: 'pushFailed', message: 'git push failed.', detail: pushed.stderr.trim() }, 409);
    }
    const head = await git.run(['rev-parse', '--short', 'HEAD'], { cwd: ready.root });
    return json({ ok: true, head: head.exitCode === 0 ? head.stdout.trim() : undefined, output: pushed.stdout.trim() });
  }

  const command = actionCommand(body);
  if (command === undefined) return fail('That action is not one this view runs.', 400);

  const options = { cwd: ready.root, signal: request.signal };
  let result = await git.run(command.args, options);
  if (result.exitCode !== 0 && command.fallback !== undefined) {
    result = await git.run(command.fallback, options);
  }
  if (result.exitCode !== 0) {
    return refuse(result.stderr.trim() || `git ${command.args[0]} failed`);
  }

  const head = await git.run(['rev-parse', '--short', 'HEAD'], { cwd: ready.root });
  return json({
    ok: true,
    head: head.exitCode === 0 ? head.stdout.trim() : undefined,
    output: result.stdout.trim(),
  });
}

/**
 * Answer a git failure in words, keeping git's own wording underneath.
 * A row the repository has already moved past is named as a code for the view to
 * translate, with git's original text carried as `detail`.
 * @param {string} stderr - what git printed.
 * @returns {Response} a 409 carrying the sentence and the original.
 */
function refuse(stderr) {
  const trimmed = stderr.trim();
  // The view translates; `message` stays as the English fallback.
  if (/pathspec .* did not match any files/i.test(trimmed)) {
    return json(
      {
        code: 'staleRow',
        message: 'That file is no longer in the state this row described. Refresh and try again.',
        detail: trimmed,
      },
      409,
    );
  }
  if (/did not match any file\(s\) known to git/i.test(trimmed)) {
    return json(
      {
        code: 'newFile',
        message: 'This file is new, so there is no committed version of it to compare against.',
        detail: trimmed,
      },
      409,
    );
  }
  return json({ message: trimmed || 'That git command failed.' }, 409);
}

/** Handle `/api/git.branches`. */
async function handleBranches(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  const root = ready.root;

  // `%(upstream:track)` carries ahead/behind in one line, so the whole roster
  // costs one command rather than one per branch.
  const listed = await git.ok(
    [
      'for-each-ref',
      '--format=%(refname:short)\t%(objectname:short)\t%(upstream:short)\t%(upstream:track)\t%(contents:subject)',
      'refs/heads',
      'refs/remotes',
    ],
    { cwd: root, signal: request.signal },
  );

  const current = await git.run(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
  const currentName = current.exitCode === 0 ? current.stdout.trim() : '';

  const branches = [];
  for (const line of listed.stdout.split('\n')) {
    if (line === '') continue;
    const [name, sha, upstream, track, ...subject] = line.split('\t');
    const counts = /ahead (\d+)/.exec(track ?? '');
    const behind = /behind (\d+)/.exec(track ?? '');
    branches.push({
      name,
      sha,
      upstream: upstream === '' ? null : upstream,
      ahead: counts === null ? 0 : Number(counts[1]),
      behind: behind === null ? 0 : Number(behind[1]),
      remote: name.startsWith('refs/remotes') || name.includes('/'),
      current: name === currentName,
      subject: subject.join('\t'),
    });
  }

  return json({
    current: currentName === 'HEAD' ? null : currentName,
    detached: currentName === 'HEAD',
    branches: branches.filter(branch => !branch.name.endsWith('/HEAD')),
  });
}

/** Handle `/api/git.stashes`. */
async function handleStashes(ctx, git, request) {
  const ready = await prepare(ctx, git, request);
  if (ready instanceof Response) return ready;
  const root = ready.root;

  const listed = await git.run(['stash', 'list', '--format=%gd%x09%gs%x09%ci'], { cwd: root, signal: request.signal });
  if (listed.exitCode !== 0) return json({ stashes: [] });

  const stashes = [];
  for (const line of listed.stdout.split('\n')) {
    if (line === '' || stashes.length >= MAX_STASHES) continue;
    const [ref, subject, date] = line.split('\t');
    if (ref === undefined) continue;
    const detail = await git.run(['stash', 'show', '--name-only', '--format=', ref], { cwd: root });
    stashes.push({
      ref,
      // `git stash` prefixes its subject with the branch it was taken on.
      branch: (subject ?? '').match(/^On ([^:]+):/)?.[1] ?? null,
      message: (subject ?? '').replace(/^On [^:]+:\s*/, '') || (subject ?? ''),
      date: date ?? '',
      files:
        detail.exitCode === 0 ? detail.stdout.split('\n').filter(entry => entry !== '').length : 0,
    });
  }

  return json({ stashes });
}

/**
 * Register the git routes inside Connection's authentication fence.
 * @param {object} ctx - Host context carrying every injected service.
 */
export function apply(ctx) {
  const git = new GitRunner(ctx);
  const lifetime = new AbortController();
  ctx.effect(() => async () => lifetime.abort());

  const routes = [
    [REPOSITORIES_PATH, ['GET'], handleRepositories],
    [STATUS_PATH, ['GET'], handleStatus],
    [UNTRACKED_PATH, ['GET'], handleUntracked],
    [DIFF_PATH, ['GET'], handleDiff],
    [FILE_PATH, ['GET'], handleFile],
    [WRITE_PATH, ['POST'], handleWrite],
    [BRANCHES_PATH, ['GET'], handleBranches],
    [STASHES_PATH, ['GET'], handleStashes],
    [ACTION_PATH, ['GET', 'POST'], handleAction],
  ];

  for (const [path, methods, handler] of routes) {
    ctx.connection.fetch.register({
      path,
      methods,
      requestBody: 'buffered',
      fetch: async (request) => {
        const signal = AbortSignal.any([request.signal, lifetime.signal]);
        try {
          return await handler(ctx, git, new Request(request, { signal }));
        } catch (error) {
          if (signal.aborted) throw error;
          const message = error instanceof Error ? error.message : String(error);
          ctx.logger?.warn?.(`[git-view] ${path}: ${message}`);
          return new Response(message, { status: 500 });
        }
      },
    });
  }
}