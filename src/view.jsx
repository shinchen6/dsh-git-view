import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiskConfirmation } from '@deepseek-ai/dsh-client-ui-primitives';

import { CommitBar, PushGate, RiskGate, SelectionBar, useActions } from './actions.jsx';
import { readDiff, readFile, readRepositories, readStatus, readSummaries, readUntracked } from './api.js';
import { DiffView, WholeFileView } from './diff.jsx';
import { FileEditor, FileView, previewKind } from './file.jsx';
import { useFileHover } from './hover.jsx';
import { t } from './i18n.js';
import { BranchMenu, RemoteActions, RepoBulkMenu, StashMenu } from './repo.jsx';
import { markChanges } from './marks.js';
import { FileTree, visibleOrder } from './tree.jsx';
import { DiffSkeleton, FileSkeleton, LoadingAnnounce, TreeSkeleton, diffLoading, fileLoading, treeLoading } from './skeleton.jsx';
import { CSS } from './styles.js';

/** Groups that start folded out of the way. */
const INITIALLY_COLLAPSED = new Set(['untracked']);

/** Which file route side answers for one list side. */
const FILE_SIDE = { staged: 'staged', unstaged: 'worktree', untracked: 'worktree' };
/** The status groups, in the order the tree renders them; also the side names. */
const GROUPS = ['conflicts', 'staged', 'unstaged', 'untracked'];

/** Below this the tree cannot show a path, above it the diff cannot show a line. */
const SPLIT_MIN = 0.22;
const SPLIT_MAX = 0.62;
const SPLIT_KEY = 'dsh-git-view:split';
const SCOPE_KEY = 'dsh-git-view:scope';
/** The three ways to read a change, and the one that opens first. */
const SCOPES = ['whole', 'changes', 'split'];
const SCOPE_DEFAULT = 'whole';
const SPLIT_DEFAULT = 0.44;

/**
 * How much height this view really has, and a ref to measure it from.
 * Nothing in the ancestor chain bounds it: the view slot renders into a
 * `display:contents` box, so `height:100%` resolves against content and the
 * view grows to whatever it holds.
 * The composer is the one thing in that layout that knows how much room is
 * left, so it is measured — and observed, because it changes height on its own.
 * @returns {{ self: object, height: number | undefined }} the ref and the usable height.
 */
function useAvailableHeight() {
  const self = useRef(undefined);
  const [room, setRoom] = useState(600);

  useEffect(() => {
    const el = self.current;
    if (el === undefined) return undefined;
    const clamp = value => Math.min(Math.max(Math.round(value), 220), window.innerHeight - 160);

    // The composer cannot be found by markup: the shell hashes its class names
    // and they change with every build. Hit-test the bottom of the window and
    // walk up to the first ancestor that belongs to the shell, not to this view.
    const seatOf = () => {
      let node = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 40);
      while (node !== null && node !== document.body) {
        if (node.contains(el) === false && node.getBoundingClientRect().height >= 96) return node;
        node = node.parentElement;
      }
      return undefined;
    };
    const composer = seatOf();

    // Measure once, on mount. After that this view can be thousands of pixels
    // tall, so re-reading the composer's position would measure our own height
    // back and grow the room without bound.
    if (composer !== undefined) {
      setRoom(clamp(composer.getBoundingClientRect().top - el.getBoundingClientRect().top - 8));
    } else {
      // No composer to read — the tab can mount before it exists. Erring short
      // costs a strip of scroll; erring long hides the commit box behind it.
      setRoom(clamp(window.innerHeight - el.getBoundingClientRect().top - 236));
    }

    // From here on, only changes that do not depend on this view's height count.
    let viewport = window.innerHeight;
    let seat = composer?.getBoundingClientRect().height ?? 0;
    const onResize = () => {
      setRoom(value => clamp(value + (window.innerHeight - viewport)));
      viewport = window.innerHeight;
    };
    // The composer grows on its own when a run starts. Its height is a property
    // of the composer, not of what sits above it, so a delta is safe to
    // subtract where a position would not be.
    const observer = composer === undefined
      ? undefined
      : new ResizeObserver(() => {
          const next = composer.getBoundingClientRect().height;
          setRoom(value => clamp(value - (next - seat)));
          seat = next;
        });
    if (observer !== undefined) observer.observe(composer);
    window.addEventListener('resize', onResize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return { self, room };
}

/**
 * Where the divider between the tree and the file sits, and a way to drag it.
 * The position belongs to the person using it and is remembered across reloads.
 * @returns {{ ratio: number, style: object, onPointerDown: Function }} the split.
 */
function useSplit() {
  const [ratio, setRatio] = useState(() => {
    try {
      const stored = Number(globalThis.localStorage?.getItem(SPLIT_KEY));
      return stored >= SPLIT_MIN && stored <= SPLIT_MAX ? stored : SPLIT_DEFAULT;
    } catch {
      return SPLIT_DEFAULT;
    }
  });
  const body = useRef(undefined);
  const drag = useRef(undefined);

  const onPointerDown = useCallback(
    event => {
      // Capture on the element that owns the pointer, not the one it started
      // on: the divider is 6px wide and the pointer very often leaves it.
      const start = event.currentTarget;
      start.setPointerCapture(event.pointerId);
      const box = body.current?.getBoundingClientRect();
      drag.current = box === undefined ? undefined : { left: box.left, width: box.width };
      const move = e => {
        const base = drag.current;
        if (base === undefined || base.width === 0) return;
        const next = (e.clientX - base.left) / base.width;
        // Clamp while dragging rather than after: without it the pane can be
        // dragged to zero and the only way back is a reload.
        setRatio(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, next)));
      };
      const end = () => {
        drag.current = undefined;
        start.removeEventListener('pointermove', move);
        start.removeEventListener('pointerup', end);
        start.removeEventListener('pointercancel', end);
      };
      start.addEventListener('pointermove', move);
      start.addEventListener('pointerup', end);
      start.addEventListener('pointercancel', end);
    },
    [],
  );

  // Persist the settled position, not every pixel of the drag.
  useEffect(() => {
    const save = () => {
      try {
        globalThis.localStorage?.setItem(SPLIT_KEY, String(ratio));
      } catch {
        // A browser that refuses storage just opens at the default again.
      }
    };
    const timer = setTimeout(save, 400);
    return () => clearTimeout(timer);
  }, [ratio]);

  return { body, style: { flexBasis: `${ratio * 100}%` }, onPointerDown };
}

/**
 * One remembered viewing choice.
 * @param {string} key - the storage entry.
 * @param {string[]} allowed - the values a stored entry may still have.
 * @param {string} fallback - what to use when nothing is stored.
 * @returns {[string, Function]} the current choice and a setter.
 */
function useChoice(key, allowed, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const stored = globalThis.localStorage?.getItem(key);
      return allowed.includes(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  });
  const choose = useCallback(next => {
    setValue(next);
    try {
      globalThis.localStorage?.setItem(key, next);
    } catch {
      // A browser that refuses storage just forgets the choice next time.
    }
  }, [key]);
  return [value, choose];
}

/**
 * The repository header: its name, its branch, how far ahead and behind that
 * branch is, and the controls that reach git.
 */
function RepoHeader({ status, onRefresh, sessionId, run, confirm, busy, loading, repoPath }) {
  const repo = status.repo;
  return (
    <div className="gv-head">
      <span className="gv-repo" title={repo.root}>
        {repo.name}
      </span>
      <BranchMenu sessionId={sessionId} repo={repo} run={run} repoPath={repoPath} />
      {repo.ahead > 0 ? <span className="gv-count">↑{repo.ahead}</span> : null}
      {repo.behind > 0 ? <span className="gv-count">↓{repo.behind}</span> : null}
      <span className="gv-spacer" />
      <StashMenu sessionId={sessionId} run={run} confirm={confirm} repoPath={repoPath} />
      <button
        type="button"
        className="gv-btn"
        onClick={onRefresh}
        disabled={busy || loading}
        aria-busy={loading}
        title={loading ? t('loading.refreshing') : t('action.refresh')}
      >
        {/* A refresh on a large repository takes seconds, so a button that only
            greys out reads as one that did not register the click. */}
        <span className={loading ? 'gv-spin' : undefined} aria-hidden="true">
          ⟳
        </span>{' '}
        {loading ? t('loading.refreshing') : t('action.refresh')}
      </button>
      <RemoteActions repo={repo} run={run} busy={busy} />
      <RepoBulkMenu status={status} run={run} confirm={confirm} busy={busy} />
    </div>
  );
}

/**
 * The detail pane's header: which file, and the view and layout choices.
 */
function DetailHeader({ file, mode, onMode, split, onSplit, wrap, onWrap, scope, onScope }) {
  // Only the working tree can be written back, so a row that shows the index or
  // a commit has no editor to offer; bytes-only files have no text to edit either.
  const editable =
    ((file.side === 'unstaged' || file.side === 'untracked') &&
      (previewKind(file.path) === 'source' || previewKind(file.path) === 'markdown'));
  // Reading is a different question from writing: gating the file view on write
  // access made a staged file look like it had no content at all.
  const viewable = previewKind(file.path) !== 'document';
  return (
    <div className="gv-detail-head">
      <span className="gv-path" title={file.path}>
        {file.path}
      </span>
      <span className="gv-spacer" />
      <button type="button" className="gv-btn" aria-pressed={mode === 'diff'} onClick={() => onMode('diff')}>
        {t('mode.diff')}
      </button>
      <button
        type="button"
        className="gv-btn"
        aria-pressed={mode === 'file'}
        disabled={!viewable}
        title={viewable ? undefined : t('edit.unavailable')}
        onClick={() => onMode('file')}
      >
        {t('mode.file')}
      </button>
      <button
        type="button"
        className="gv-btn"
        aria-pressed={mode === 'edit'}
        disabled={!editable}
        title={editable ? undefined : t('edit.unavailable')}
        onClick={() => onMode('edit')}
      >
        {t('mode.edit')}
      </button>
      {mode === 'diff' ? (
        <>
          {/* One control rather than a scope toggle beside a layout toggle: the three
              choices are not independent, and letting the user set two states
              that then get silently corrected is worse than asking once. */}
          <button type="button" className="gv-btn" aria-pressed={scope === 'whole'} onClick={() => onScope('whole')}>
            {t('diff.whole')}
          </button>
          <button type="button" className="gv-btn" aria-pressed={scope === 'changes'} onClick={() => onScope('changes')}>
            {t('diff.changes')}
          </button>
          <button type="button" className="gv-btn" aria-pressed={split} onClick={() => onSplit(true)}>
            {t('layout.split')}
          </button>
        </>
      ) : null}
      {mode === 'file' ? (
        <button type="button" className="gv-btn" aria-pressed={wrap} onClick={onWrap}>
          {t('action.wrap')}
        </button>
      ) : null}
    </div>
  );
}

/** The list column's own states: still loading, refused, or genuinely empty. */
function TreePanel({ status, failure }) {
  if (status === undefined) {
    if (failure !== undefined) return null;
    return (
      <>
        <LoadingAnnounce label={treeLoading()} />
        <TreeSkeleton />
      </>
    );
  }
  if (failure !== undefined) return <div className="gv-note error">{failure.message}</div>;
  if (status.available === false) {
    return (
      <div className="gv-note">
        {status.reason === 'git-unavailable' ? t('empty.gitUnavailable') : t('empty.notRepository')}
      </div>
    );
  }
  return null;
}

/**
 * The Git conversation view: one repository's working tree, split into its file
 * list and one file's comparison.
 *
 * @param {{ sessionId: string }} props - the slot's runtime props.
 * @returns {React.ReactElement} the view.
 */
export function GitView({ sessionId, useSessionStatus }) {
  const [status, setStatus] = useState(undefined);
  // Every project the working directory offers, each with its own summary. The
  // list is shown whether or not a project has changes — a project absent from
  // it is one nobody can tell is quiet.
  const [projects, setProjects] = useState(undefined);
  const [summaries, setSummaries] = useState(undefined);
  const [treeDrawn, setTreeDrawn] = useState(false);
  const [projectPath, setProjectPath] = useState(undefined);
  const [failure, setFailure] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState(undefined);
  const [diff, setDiff] = useState(undefined);
  const [file, setFile] = useState(undefined);
  const [mode, setMode] = useState('diff');
  // One choice for the whole file, the changes only, or side by side — not two
  // independent toggles, which would have to be corrected behind the user's back.
  const [scope, setScope] = useChoice(SCOPE_KEY, SCOPES, SCOPE_DEFAULT);
  const split = scope === 'split';
  const [wrap, setWrap] = useState(false);
  const columns = useSplit();
  const room = useAvailableHeight();
  const [collapsed, setCollapsed] = useState(INITIALLY_COLLAPSED);
  // A pending push belongs to the repository it was opened against: if the
  // branch or the status changes while the dialog is up, the list it names
  // is no longer the list that would be pushed.
  const [pushGate, setPushGate] = useState(undefined);
  // Untracked directories arrive closed, and each is opened by asking about
  // that directory alone: the cost of a folder with twenty thousand files is
  // paid only by the person who opens it.
  const [opened, setOpened] = useState(() => new Map());
  const pending = useRef([]);
  useEffect(() => () => pending.current.forEach(controller => controller.abort()), []);
  const requestOpen = useCallback(
    dir => {
      setOpened(current => {
        if (current.has(dir)) return current;
        const next = new Map(current);
        next.set(dir, { loading: true });
        return next;
      });
      const controller = new AbortController();
      pending.current.push(controller);
      // The trailing slash marks a directory; the route refuses anything else.
      // The `opened` key stays slash-less: it is a node path, not a pathspec.
      readUntracked(sessionId, `${dir}/`, projectPath, controller.signal)
        .then(answer =>
          setOpened(current => {
            const next = new Map(current);
            next.set(dir, { files: answer.files, total: answer.total, truncated: answer.truncated });
            return next;
          }),
        )
        .catch(error => {
          if (controller.signal.aborted) return;
          setOpened(current => {
            const next = new Map(current);
            next.set(dir, { failure: error.message });
            return next;
          });
        })
        .finally(() => {
          pending.current = pending.current.filter(one => one !== controller);
        });
    },
    [sessionId, projectPath],
  );
  const expand = useMemo(() => ({ state: opened, request: requestOpen }), [opened, requestOpen]);

  // An opened directory replaces its own placeholder row with the files inside
  // it, so the tree needs one list with both in it.
  const shown = useMemo(() => {
    if (opened.size === 0 || status === undefined) return status;
    return {
      ...status,
      untracked: status.untracked.flatMap(file => {
        if (file.dir !== true) return [file];
        const answer = opened.get(file.path.replace(/\/+$/, ''));
        return answer?.files ?? [file];
      }),
    };
  }, [status, opened]);

  // An untracked directory starts folded shut.
  //
  // Not as a preference — as the whole point. The status scan stopped descending
  // into these folders precisely so their contents would cost only the person
  // opening them, and a tree that opens everything on mount asks for all of it:
  // one request per untracked folder, the very scan this avoids.
  useEffect(() => {
    const shut = (shown?.untracked ?? [])
      .filter(file => file.dir === true)
      .map(file => file.path.replace(/\/+$/, ''))
      .filter(path => !opened.has(path));
    if (shut.length === 0) return;
    setCollapsed(current => {
      const next = new Set(current);
      let changed = false;
      for (const path of shut) {
        if (!next.has(`untracked:${path}`)) {
          next.add(`untracked:${path}`);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [shown, opened]);

  const hover = useFileHover(sessionId);
  // A pending preview belongs to the file it was opened for. Once the tree has
  // changed underneath it, showing that file's diff would be showing a lie.
  useEffect(() => {
    hover.dismiss();
  }, [status, hover.dismiss]);

  // Checked paths, for staging an arbitrary subset rather than a whole group.
  const [checked, setChecked] = useState(() => new Set());
  const toggleCheck = useCallback(path => {
    setChecked(current => {
      const next = new Set(current);
      if (!next.delete(path)) next.add(path);
      return next;
    });
  }, []);
  // A checked path is a promise that a bulk action will find that file. Staging,
  // discarding or committing can all retire one, so the promise is re-checked
  // against the tree after every change rather than trusted from the click.
  useEffect(() => {
    if (status === undefined || status.available === false) return;
    const live = new Set([...GROUPS].flatMap(group => (status[group] ?? []).map(file => file.path)));
    setChecked(current => {
      const next = new Set([...current].filter(path => live.has(path)));
      return next.size === current.size ? current : next;
    });
  }, [status]);
  // Checked files carry their side so the bar can tell a staged path from an
  // untracked one; `discard` is a different git command for each.
  const checkedFiles = useMemo(
    () =>
      GROUPS.flatMap(group => {
        const side = group === 'conflicts' ? 'unstaged' : group;
        return (status?.[group] ?? [])
          .filter(file => checked.has(file.path))
          .map(file => ({ ...file, side }));
      }),
    [status, checked],
  );

  // The tree is re-read when a turn finishes, not on a timer. Only the running
  // edge counts, so an idle view does not poll itself.
  const running = useSessionStatus?.(snapshot => snapshot.get(sessionId)?.running);
  const wasRunning = useRef(running);
  useEffect(() => {
    if (wasRunning.current === true && running === false) setReload(value => value + 1);
    wasRunning.current = running;
  }, [running]);

  // The set of projects is read first, because which project is current follows
  // from it; reading the status before knowing the list would briefly show a
  // different repository than the one about to be selected.
  //
  // This costs no git at all, so the list appears as soon as the filesystem has
  // been walked. What each project is waiting on comes afterwards and is slow
  // on a wide working directory, which is the whole reason it is not asked for
  // here: a row that names a project beats a blank panel while thirteen status
  // calls are still in flight.
  useEffect(() => {
    const controller = new AbortController();
    // Walking a wide workspace costs a listing plus one lstat per child, which
    // measured 2.6 s here. It is paid when the panel opens and when a refresh is
    // asked for, never on a poll of a workspace that has not changed.
    readRepositories(sessionId, reload > 0, controller.signal)
      .then(answer => {
        setProjects(answer.projects);
        setFailure(undefined);
        // Keep the current project when it survives the scan, so a refresh does
        // not silently move the user back to the enclosing repository.
        setProjectPath(current =>
          current !== undefined && answer.projects.some(entry => entry.path === current)
            ? current
            : (answer.projects[0]?.path ?? undefined),
        );
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        setProjects([]);
        setFailure(error);
      });
    return () => controller.abort();
  }, [sessionId, reload]);

  // The markers, once the list is on screen and the file tree has stopped
  // competing for the machine. Thirteen status calls issued alongside the read
  // that draws the tree are what pushed the summary budget past its deadline
  // on a wide working directory: measured alone they finish in three to four
  // seconds, issued together with a tree of several thousand entries only one
  // had answered by six. Nothing here is on the critical path, so there is no
  // reason to start it before the thing the panel is actually waiting on.
  //
  // A project whose answer never arrives keeps its row, hollow-dotted and
  // marked as still being read.
  useEffect(() => {
    if (!treeDrawn || projects === undefined || projects.length === 0) return undefined;
    const controller = new AbortController();
    readSummaries(sessionId, controller.signal)
      .then(answer => setSummaries(answer.summaries))
      // A failed marker pass leaves every row marked as still being read, which
      // is true: nothing has claimed otherwise.
      .catch(error => {
        if (!controller.signal.aborted) setSummaries([]);
      });
    return () => controller.abort();
  }, [sessionId, reload, projects, treeDrawn]);

  // The session's repository is re-read when the view opens, when asked, and
  // whenever the current project changes.
  useEffect(() => {
    const controller = new AbortController();
    setFailure(undefined);
    setLoading(true);
    readStatus(sessionId, projectPath, controller.signal)
      .then(answer => {
        setStatus(answer);
        // One latch, never unlatched: the markers wait for the first tree, but
        // changing project afterwards must not send them back to the start.
        setTreeDrawn(true);
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        setStatus(undefined);
        setFailure(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [sessionId, projectPath, reload]);

  // A refresh can move a file between groups, so the selection's side is
  // re-resolved against the fresh status: the selection follows the file, and
  // the editor locks once the file has left the working tree.
  //
  // Only a side that no longer holds the row is re-resolved. Asking "which group
  // has this path" and taking the first answer would snap a working-tree row
  // back to the index on every render, because `staged` is searched first.
  useEffect(() => {
    if (selected === undefined || status === undefined || status.available === false) return;
    const stillThere = (status[selected.side] ?? []).some(file => file.path === selected.path);
    if (stillThere) return;
    const side = GROUPS.find(group => (status[group] ?? []).some(file => file.path === selected.path));
    if (side === undefined) setSelected(undefined);
    else setSelected(current => (current === undefined ? current : { ...current, side }));
  }, [status, selected]);

  // One comparison at a time; a newer selection abandons the older request.
  useEffect(() => {
    if (selected === undefined) {
      setDiff(undefined);
      return undefined;
    }
    const controller = new AbortController();
    setDiff(undefined);
    readDiff(sessionId, selected.path, selected.side, projectPath, controller.signal)
      .then(answer => setDiff(answer))
      .catch(error => {
        if (controller.signal.aborted) return;
        setDiff({ kind: 'error', message: error.message });
      });
    return () => controller.abort();
  }, [sessionId, selected, projectPath]);

  // The whole-file answer is read on demand and kept while a view still wants it:
  // one fetch serves all three views, so moving between them never re-reads the
  // file. It is discarded only when the selection changes; the key carries the
  // reload count so a save still re-reads the file it just wrote.
  const fileKey = useRef(undefined);
  const needsText =
    selected !== undefined &&
    (mode === 'file' || mode === 'edit' || (mode === 'diff' && scope === 'whole'));
  useEffect(() => {
    if (selected === undefined) {
      fileKey.current = undefined;
      setFile(undefined);
      return undefined;
    }
    if (!needsText) return undefined;
    const key = `${projectPath ?? ''}:${selected.side}:${selected.path}#${reload}`;
    if (fileKey.current === key) return undefined;
    const controller = new AbortController();
    fileKey.current = key;
    setFile(undefined);
    readFile(sessionId, selected.path, FILE_SIDE[selected.side] ?? 'worktree', projectPath, controller.signal)
      .then(answer => setFile(answer))
      .catch(error => {
        if (controller.signal.aborted) return;
        setFile({ kind: 'error', message: error.message });
      });
    return () => controller.abort();
  }, [sessionId, selected, needsText, reload, projectPath]);

  // Generating over a message the user already typed replaces it, so it takes
  // the gate rather than running on its own.
  const [generateGate, setGenerateGate] = useState(undefined);  const confirmGenerate = useCallback(async make => {
    setGenerateGate({
      title: t('commit.replaceTitle'),
      description: t('commit.replaceBody'),
      resolve: value => {
        setGenerateGate(undefined);
        return value ? make() : undefined;
      },
    });
    return undefined;
  }, []);

  const toggleGroup = useCallback(key => {    setCollapsed(previous => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  // A directory folds independently of the group that holds it, and under its
  // own key so two same-named directories in different groups never collide.
  const toggleDir = useCallback(key => {
    setCollapsed(previous => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  const reloadStatus = useCallback(
    () =>
      readStatus(sessionId, projectPath)
        .then(answer => {
          setStatus(answer);
          setFailure(undefined);
        })
        .catch(error => setFailure(error)),
    [sessionId, projectPath],
  );

  // A refresh also re-reads the project list, so a repository created since the
  // view opened appears without the panel having to be reopened.
  const refreshAll = useCallback(() => {
    setReload(value => value + 1);
  }, []);

  const actions = useActions(sessionId, reloadStatus, projectPath);
  const { run, confirm, gate, dismiss, busy, generating, generateMessage, problem } = actions;

  /**
   * Walk the visible rows with the arrow keys, the way a file list should.
   * Movement is by position in the rendered order and selects as it goes, so
   * the detail pane follows along without a separate confirm step.
   */
  const move = useCallback(
    step => {
      if (status?.available !== true) return;
      const order = visibleOrder(shown, collapsed);
      if (order.length === 0) return;
      const at = order.findIndex(entry => entry.path === selected?.path);
      const next = at < 0 ? (step > 0 ? 0 : order.length - 1) : Math.min(order.length - 1, Math.max(0, at + step));
      const target = order[next];
      const file = [...status.conflicts, ...status.staged, ...status.unstaged, ...status.untracked].find(
        candidate => candidate.path === target.path,
      );
      if (file !== undefined) setSelected({ ...file, side: target.side });
    },
    [status, collapsed, selected],
  );

  return (
    <div className="gv" ref={room.self} style={{ '--gv-room': `${room.room}px` }}>
      <style>{CSS}</style>
      {status?.available === true && failure === undefined ? (
        <RepoHeader
          status={status}
          onRefresh={refreshAll}
          sessionId={sessionId}
          run={run}
          confirm={confirm}
          busy={busy}
          loading={loading}
          repoPath={projectPath}
        />
      ) : (
        <div className="gv-head">
          <span className="gv-spacer" />
        </div>
      )}
      {problem === undefined ? null : <div className="gv-banner error">{problem}</div>}
      <div className="gv-body" ref={columns.body}>
        <div className="gv-list" style={columns.style}>
          {status === undefined || status.available === false ? (
            <TreePanel status={status} failure={failure} />
          ) : (
            <>
              <CommitBar
                staged={status.staged}
                busy={busy}
                generating={generating}
                problem={problem}
                run={run}
                generateMessage={generateMessage}
                confirmGenerate={confirmGenerate}
                confirmPush={() => setPushGate({ repo: status.repo })}
                repo={status.repo}
                // Named here because the commit lands in the current project and
                // nothing else on screen says which one that is.
                projectName={status.repo?.name}
                projects={projects}
                summaries={summaries}
                currentProject={projectPath}
                onSelectProject={setProjectPath}
              />
              <div
                className="gv-tree-scroll"
                tabIndex={0}
                role="tree"
                aria-label={t('view.git')}
                onKeyDown={event => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    move(1);
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    move(-1);
                  }
                }}
              >
                <FileTree
                  status={shown}
                  selected={selected}
                  onSelect={setSelected}
                  collapsed={collapsed}
                  onToggle={toggleGroup}
                  onToggleDir={toggleDir}
                  actions={{ run, confirm }}
                  hover={hover}
                  checked={checked}
                  onCheck={toggleCheck}
                  expand={expand}
                />
              </div>
              <SelectionBar files={checkedFiles} run={run} confirm={confirm} />
            </>
          )}
        </div>
        <div
          className="gv-sizer"
          role="separator"
          aria-orientation="vertical"
          aria-label={t('view.resize')}
          onPointerDown={columns.onPointerDown}
        />
        <div className="gv-detail">
          {selected === undefined ? (
            <div className="gv-note">{t('empty.select')}</div>
          ) : (
            <>
              <DetailHeader
                file={selected}
                mode={mode}
                onMode={setMode}
                split={split}
                onSplit={() => setScope('split')}
                wrap={wrap}
                onWrap={() => setWrap(value => !value)}
                scope={scope}
                onScope={setScope}
              />
              <div className="gv-scroll">
                {mode === 'diff' ? (
                  scope === 'whole' ? (
                    // The whole file is shown from the same text the editor edits, and the
                    // change is marked from the diff's own line numbers.
                    <WholeFileView
                      data={file}
                      marks={markChanges(diff?.hunks)}
                      wrap={wrap}
                    />
                  ) : (
                    <DiffView data={diff} split={split} wrap={wrap} />
                  )
                ) : mode === 'edit' ? (
                  <FileEditor
                    data={file}
                    path={selected.path}
                    sessionId={sessionId}
                    repoPath={projectPath}
                    onSaved={() => setReload(value => value + 1)}
                  />
                ) : (
                  <FileView data={file} wrap={wrap} path={selected.path} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <RiskGate gate={gate} onDismiss={dismiss} run={run} />
      <PushGate
        gate={pushGate}
        onClose={() => setPushGate(undefined)}
        onConfirm={() => {
          setPushGate(undefined);
          run({ action: 'push' });
        }}
      />
      <RiskConfirmation
        open={generateGate !== undefined}
        title={generateGate?.title}
        description={generateGate?.description}
        acknowledgeLabel={t('common.cancel')}
        confirmLabel={t('commit.generate')}
        onCancel={() => generateGate?.resolve(false)}
        onConfirm={() => generateGate?.resolve(true)}
      />
      {hover.card}
    </div>
  );
}
