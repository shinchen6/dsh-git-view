import { Menu, Modal, RiskConfirmation } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useEffect, useState } from 'react';

import { postAction } from './api.js';
import { t } from './i18n.js';
import { ProjectLayer } from './projects.jsx';

/** How long one model call may take before the view reports it as stuck. */
const GENERATE_TIMEOUT_MS = 60_000;

/**
 * How long an action must run before the panel says it is running.
 *
 * Staging one file takes a few milliseconds, and a line that appears and
 * vanishes within one frame is a flicker rather than a message. Anything still
 * going after this long is worth naming, because the alternative on a slow
 * remote is a button that looks like it did nothing.
 */
const WORKING_AFTER_MS = 400;

/** How long a finished action's result stays on screen before it clears itself. */
const DONE_FOR_MS = 6_000;

/**
 * Run repository actions and surface the ones that need a deliberate yes.
 * Nothing here runs on its own: the caller hands this hook a body and it either
 * runs it or holds it behind the confirmation gate. A refusal from git is shown
 * verbatim, because git's message is the only thing that knows why it refused.
 * @param {string} sessionId - the session whose working directory is addressed.
 * @param {() => Promise<void>} refresh - re-read the status after a change.
 * @returns {object} the action runner, its busy flags, its last refusal, and the gate.
 */
export function useActions(sessionId, refresh, repo) {
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [problem, setProblem] = useState(undefined);
  const [working, setWorking] = useState(undefined);
  const [done, setDone] = useState(undefined);
  const [gate, setGate] = useState(undefined);

  // A result from an action that has already been replaced is stale, so it
  // clears itself rather than sitting there claiming to be the last thing that
  // happened.
  useEffect(() => {
    if (done === undefined) return undefined;
    const timer = setTimeout(() => setDone(undefined), DONE_FOR_MS);
    return () => clearTimeout(timer);
  }, [done]);

  /**
   * Run one action.
   *
   * `describe` names what is happening while it happens and what happened
   * afterwards. Staging a file needs neither — it is visible in the tree the
   * moment it lands — but a push produces no trace in the panel at all, so
   * without a line here it is indistinguishable from a button that did nothing.
   *
   * @param {object} body - the action to run.
   * @param {{ working?: string, done?: string | ((answer: object) => string) }} [describe] - the labels.
   * @returns {Promise<object | undefined>} the answer, or undefined on refusal.
   */
  const run = useCallback(
    async (body, describe = {}) => {
      setBusy(true);
      setProblem(undefined);
      setDone(undefined);
      setWorking(undefined);
      const slow = setTimeout(() => setWorking(describe.working ?? t('action.working')), WORKING_AFTER_MS);
      try {
        const answer = await postAction(sessionId, body, repo);
        await refresh();
        if (describe.done !== undefined) {
          setDone(typeof describe.done === 'function' ? describe.done(answer) : describe.done);
        }
        return answer;
      } catch (error) {
        setProblem(error.message);
        return undefined;
      } finally {
        clearTimeout(slow);
        setWorking(undefined);
        setBusy(false);
      }
    },
    [sessionId, refresh, repo],
  );

  /** Ask first, then run: for anything the user's next commit cannot undo. */
  const confirm = useCallback((title, description, body) => setGate({ title, description, body }), []);

  /**
   * Ask the configured model to write the message.
   * This is a read, not a change, so it never takes the working-tree gate and
   * never refreshes the tree.
   * @returns {Promise<string | undefined>} the message, or undefined on refusal.
   */
  const generateMessage = useCallback(async () => {
    setGenerating(true);
    setProblem(undefined);
    try {
      // The one action here that can hang indefinitely; a button that
      // spins forever reads as a dead button.
      const answer = await postAction(
        sessionId,
        { action: 'generateMessage' },
        repo,
        AbortSignal.timeout(GENERATE_TIMEOUT_MS),
      );
      // A message the model could not finish, or one written from a
      // truncated diff, still arrives as text; the flags let the caller say so.
      if (answer?.truncated === true) setProblem(t('commit.truncatedModel'));
      else if (answer?.diffTruncated === true) setProblem(t('commit.truncatedDiff'));
      return answer?.message;
    } catch (error) {
      setProblem(
        error?.name === 'TimeoutError' || error?.name === 'AbortError'
          ? t('commit.generateTimeout')
          : error.message,
      );
      return undefined;
    } finally {
      setGenerating(false);
    }
  }, [sessionId]);

  return {
    run,
    confirm,
    generateMessage,
    gate,
    busy,
    generating,
    problem,
    working,
    done,
    dismiss: () => setGate(undefined),
  };
}

/**
 * The confirmation every irreversible action passes through.
 * The acknowledgement resets whenever a different action is held, so one
 * checked box can never authorize a second, unrelated action.
 * @param {object} props - the pending gate and the two ways out of it.
 * @returns {React.ReactElement} the gate, rendered only while one is pending.
 */
export function RiskGate({ gate, onDismiss, run }) {
  const [acknowledged, setAcknowledged] = useState(false);
  if (gate === undefined) return null;
  return (
    <RiskConfirmation
      open
      title={gate.title}
      description={gate.description}
      acknowledgeLabel={t('risk.acknowledge')}
      cancelLabel={t('action.cancel')}
      closeLabel={t('action.close')}
      confirmLabel={t('action.confirm')}
      acknowledged={acknowledged}
      onAcknowledgedChange={setAcknowledged}
      onCancel={() => {
        setAcknowledged(false);
        onDismiss();
      }}
      onConfirm={() => {
        setAcknowledged(false);
        onDismiss();
        // A gate may carry several actions that only make sense together —
        // discarding a mixed selection needs one call per side. A body that is
        // a function means "run this".
        if (typeof gate.body === 'function') gate.body();
        else run(gate.body);
      }}
    />
  );
}

/**
 * The commit bar, laid out as a source-control panel lays it out.
 * The message field is a growing multi-line box rather than a one-line input,
 * because a commit message is often a subject plus a body.
 * @param {object} props - the staged set and the action runner.
 * @returns {React.ReactElement} the bar.
 */
export function CommitBar({ staged, busy, generating, problem, working, done, run, generateMessage, confirmGenerate, confirmPush, repo, projectName, projects, summaries, currentProject, onSelectProject }) {
  // One draft per project, not one draft for the view: a message half-written
  // for one repository must not be sitting in the box when another is current.
  const [drafts, setDrafts] = useState(() => new Map());
  const key = currentProject ?? '';
  const message = drafts.get(key) ?? '';
  const setMessage = value => setDrafts(current => {
    const next = new Map(current);
    next.set(key, value);
    return next;
  });
  const [wide, setWide] = useState(false);
  const idle = !busy && !generating;
  const committable = idle && staged.length > 0 && message.trim() !== '';
  // Push sits beside Commit rather than in the header: a header arrow reads
  // as "submit" in Chinese, so the user could not tell the button touched the remote.
  const noRemote = repo?.hasRemote === false;

  const submit = () => {
    if (!committable) return;
    setMessage('');
    run(
      { action: 'commit', message: message.trim() },
      { done: t('action.committed', { project: projectName ?? '' }) },
    );
  };

  return (
    <>
      <ProjectLayer projects={projects} summaries={summaries} current={currentProject} onSelect={onSelectProject} />
      <div className={`gv-commit${wide ? ' is-open' : ''}`}>
      <div className="gv-commit-row">
        <textarea
          id="gv-commit-message"
          className="gv-input gv-textarea"
          value={message}
          rows={2}
          disabled={!idle}
          placeholder={t('commit.placeholder')}
          aria-label={t('commit.placeholder')}
          aria-expanded={wide}
          onChange={event => setMessage(event.target.value)}
          onKeyDown={event => {
            // Enter keeps its usual meaning here: a new line in a message.
            // Committing from the keyboard is a modifier, so a multi-line
            // message stays writable.
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {/* The field is pinned to the bottom of the window, so the grip sits at its top
            right; the native grip cannot be moved, so it is turned off and this
            replaces it. */}
        <button
          type="button"
          className="gv-btn icon gv-commit-expand"
          title={wide ? t('commit.collapse') : t('commit.expand')}
          aria-label={wide ? t('commit.collapse') : t('commit.expand')}
          aria-expanded={wide}
          aria-controls="gv-commit-message"
          onClick={() => setWide(value => !value)}
        >
          <span aria-hidden="true">{wide ? '⌄' : '⌃'}</span>
        </button>
      </div>
      <div className="gv-commit-bar">
        <button
          type="button"
          className="gv-btn"
          title={staged.length === 0 ? t('commit.nothingStaged') : generating ? t('commit.generating') : t('commit.generate')}
          aria-label={t('commit.generate')}
          aria-busy={generating}
          disabled={!idle || staged.length === 0}
          onClick={async () => {
            // Generating over a typed message loses what was typed, so it takes the
            // confirmation the other irreversible things here use.
            const generated = await (message.trim() === '' ? generateMessage() : confirmGenerate(generateMessage));
            if (typeof generated === 'string') setMessage(generated);
          }}
        >
          <span aria-hidden="true">{generating ? '…' : '✨'}</span> {t('commit.generateShort')}
        </button>
        <button
          type="button"
          className="gv-btn primary gv-commit-go"
          title={staged.length === 0 ? t('commit.nothingStaged') : t('commit.submit')}
          disabled={!committable}
          onClick={submit}
        >
          {/* The project is named on the button: the commit lands in the current
              project, and on a wide workspace nothing else nearby says which. */}
          <span aria-hidden="true">✓</span> {projectName === undefined
            ? t('commit.submit')
            : `${t('commit.submit')} · ${projectName}`}
        </button>
        {/* Enabled on its own terms: pushing does not depend on the message box
            being non-empty or anything being staged. */}
        <button
          type="button"
          className="gv-btn gv-commit-push"
          title={noRemote ? t('remote.noRemote') : t('repo.push')}
          aria-label={t('repo.push')}
          disabled={busy || noRemote}
          onClick={() => confirmPush()}
        >
          <span aria-hidden="true">↑</span> {t('repo.push')}
        </button>
      </div>
      {/* Why the two buttons above are greyed out, stated without a click first. */}
      {staged.length === 0 ? (
        <span className="gv-commit-hint">{t('commit.nothingStagedHint')}</span>
      ) : null}
      {/* The result of the last thing that ran, next to the control that ran it:
          a banner above the panel scrolls away and is never seen. */}
      {generating || working !== undefined ? (
        <span className="gv-commit-note" role="status">
          {generating ? t('commit.generating') : working}
        </span>
      ) : problem !== undefined ? (
        <span className="gv-commit-note error" role="alert">
          {problem}
        </span>
      ) : done !== undefined ? (
        // A push leaves nothing behind in the panel: the commits are gone from
        // the branch and the ahead count drops to zero, which looks exactly like
        // never having pushed. So the one action with no other evidence says so.
        <span className="gv-commit-note done" role="status">
          {done}
        </span>
      ) : null}
      </div>
    </>
  );
}

/**
 * The second look at a push, naming the commits that are about to leave.
 * A branch with nothing ahead of it says so rather than showing an empty list.
 * @param {object} props - the pending push and the two ways out of it.
 * @returns {React.ReactPortal | null} the dialog, or nothing while it is closed.
 */
export function PushGate({ gate, onClose, onConfirm }) {
  if (gate === undefined) return null;
  const { repo } = gate;
  const target = repo?.upstream ?? t('repo.push');
  // Absent is not the same as empty: the Host may predate this dialog, and
  // reporting "zero commits" for a measurement never taken is what this dialog stops.
  const measured = Array.isArray(repo?.outgoing);
  const outgoing = measured ? repo.outgoing : [];
  return (
    <Modal
      open
      onClose={onClose}
      closeLabel={t('action.close')}
      title={t('push.title')}
      description={measured ? t('push.summary', { n: outgoing.length, target }) : t('push.unknown', { target })}
      className="gv-push-modal"
      contentClassName="gv-push-list"
      footer={
        <>
          <button type="button" className="gv-btn" onClick={onClose}>
            {t('action.cancel')}
          </button>
          <button type="button" className="gv-btn primary" data-modal-autofocus onClick={onConfirm}>
            <span aria-hidden="true">↑</span> {t('repo.push')}
          </button>
        </>
      }
    >
      {!measured ? (
        <p className="gv-push-empty">{t('push.unknownBody')}</p>
      ) : outgoing.length === 0 ? (
        <p className="gv-push-empty">{t('push.nothingAhead', { target })}</p>
      ) : (
        <ul className="gv-push-commits" aria-label={t('push.list')}>
          {outgoing.map(commit => (
            <li key={commit.sha} className="gv-push-commit">
              <span className="gv-push-sha">{commit.sha}</span>
              <span className="gv-push-subject">{commit.subject}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/**
 * One row's controls: the toggle that is used most, and a menu for the rest.
 * Staging is the most repeated action in a source-control panel, so it is a
 * one-click button; everything that can throw work away still goes to the gate.
 * @param {object} props - the file, the side it is on, and the action runner.
 * @returns {React.ReactElement} the row controls.
 */
export function RowActions({ file, side, run, confirm }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const staged = side === 'staged';

  const items = staged
    ? [
        { id: 'unstage', label: t('action.unstage') },
        { id: 'restore', label: t('action.restore'), danger: true },
      ]
    : [
        { id: 'stage', label: t('action.stage') },
        {
          id: 'discard',
          label: side === 'untracked' ? t('action.deleteFile') : t('action.discard'),
          danger: true,
        },
      ];

  const toggle = staged
    ? { action: 'unstage', paths: [file.path] }
    : { action: 'stage', paths: [file.path] };

  return (
    <span className="gv-row-actions">
      <button
        type="button"
        className="gv-quick"
        title={staged ? t('action.unstage') : t('action.stage')}
        aria-label={staged ? t('action.unstage') : t('action.stage')}
        onClick={event => {
          event.stopPropagation();
          run(toggle);
        }}
      >
        {staged ? '−' : '+'}
      </button>
      <Menu
        open={open}
        align="end"
        dense
        portal
        anchor={
          <button
            type="button"
            className="gv-more"
            aria-label={t('action.more')}
            aria-expanded={open}
            onClick={event => {
              event.stopPropagation();
              setOpen(value => !value);
            }}
          >
            ⋯
          </button>
        }
        items={items}
        onSelect={id => {
          close();
          if (id === 'stage') run({ action: 'stage', paths: [file.path] });
          else if (id === 'unstage') run({ action: 'unstage', paths: [file.path] });
          else if (id === 'discard') {
            confirm(
              side === 'untracked' ? t('risk.deleteTitle') : t('risk.discardTitle'),
              t('risk.discardBody').replace('{path}', file.path),
              { action: 'discard', path: file.path, side },
            );
          } else if (id === 'restore') {
            confirm(t('risk.restoreTitle'), t('risk.restoreBody').replace('{path}', file.path), {
              action: 'restore',
              path: file.path,
              side,
            });
          }
        }}
        onClose={close}
      />
    </span>
  );
}

/**
 * What to do with the files that are checked.
 * A checked set can straddle sides, so the destructive action is issued once per
 * side with that side's paths; one call naming all of them would either skip the
 * untracked files or restore files that were never tracked.
 * @param {object} props - the checked files and the action runner.
 * @returns {React.ReactElement} the bar.
 */
export function SelectionBar({ files, run, confirm }) {
  if (files.length === 0) return null;
  const paths = files.map(file => file.path);
  const bySide = side => files.filter(file => file.side === side).map(file => file.path);
  const staged = bySide('staged');
  const unstaged = bySide('unstaged');
  const untracked = bySide('untracked');
  const discardable = unstaged.length + untracked.length;

  return (
    <div className="gv-selection">
      <span className="gv-selection-count">{t('selection.count', { n: files.length })}</span>
      <button
        type="button"
        className="gv-btn"
        onClick={() => run({ action: 'stage', paths })}
      >
        {t('selection.stage')}
      </button>
      {staged.length === 0 ? null : (
        <button type="button" className="gv-btn" onClick={() => run({ action: 'unstage', paths: staged })}>
          {t('selection.unstage')}
        </button>
      )}
      {discardable === 0 ? null : (
        <button
          type="button"
          className="gv-btn"
          onClick={() => {
            const title = untracked.length > 0 ? t('risk.deleteTitle') : t('risk.discardTitle');
            const body = t(untracked.length > 0 ? 'risk.deleteBody' : 'risk.discardBody', { n: discardable });
            confirm(title, body, async () => {
              // One `discard` per side, run in turn: the action means something
              // different on each one, so they cannot share a single call.
              if (unstaged.length > 0) await run({ action: 'discard', side: 'unstaged', paths: unstaged });
              if (untracked.length > 0) await run({ action: 'discard', side: 'untracked', paths: untracked });
            });
          }}
        >
          {untracked.length > 0 ? t('selection.delete') : t('selection.discard')}
        </button>
      )}
    </div>
  );
}

/**
 * A directory heading's controls, which act on every file beneath it at once.
 * The destructive one goes out to the confirmation gate, naming the count.
 * @param {object} props - the directory's side and its paths.
 * @returns {React.ReactElement | null} the strip, or nothing when it is empty.
 */
export function DirActions({ side, files, paths, run, confirm }) {
  if (paths.length === 0) return null;
  const staged = side === 'staged';
  // A directory in the working tree group can hold either kind of file, so the
  // group cannot say what discarding means for it. The rows can: `git clean`
  // for the `?` ones, `git checkout` for the rest. If both are present the
  // strip drops the destructive button rather than guessing.
  const kinds = new Set((files ?? []).map(file => (file.status === '?' ? 'untracked' : 'unstaged')));
  const untracked = staged || kinds.size !== 1 ? false : kinds.has('untracked');
  const mixed = kinds.size > 1;

  return (
    <span className="gv-row-actions">
      <button
        type="button"
        className="gv-quick"
        title={staged ? t('group.unstageAll') : t('group.stageAll')}
        aria-label={staged ? t('group.unstageAll') : t('group.stageAll')}
        onClick={event => {
          event.stopPropagation();
          run(staged ? { action: 'unstage', paths } : { action: 'stage', paths });
        }}
      >
        {staged ? '−' : '+'}
      </button>
      {staged || mixed ? null : (
        <button
          type="button"
          className="gv-quick"
          title={untracked ? t('risk.deleteAllTitle') : t('group.discardAll')}
          aria-label={untracked ? t('risk.deleteAllTitle') : t('group.discardAll')}
          onClick={event => {
            event.stopPropagation();
            confirm(
              untracked ? t('risk.deleteAllTitle') : t('risk.discardAllTitle'),
              t(untracked ? 'risk.deleteAllBody' : 'risk.discardAllBody', { n: paths.length }),
              { action: 'discard', side: untracked ? 'untracked' : 'unstaged', paths },
            );
          }}
        >
          ⊘
        </button>
      )}
    </span>
  );
}

/**
 * A group's controls, which act on every file in that group.
 *
 * @param {object} props - the group key, its side, and its paths.
 * @returns {React.ReactElement | null} the strip, or nothing when the group is empty.
 */
export function GroupActions({ side, files, paths, run, confirm }) {
  return <DirActions side={side} files={files} paths={paths} run={run} confirm={confirm} />;
}
