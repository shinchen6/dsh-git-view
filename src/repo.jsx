import { Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import { useEffect, useState } from 'react';

import { readBranches, readStashes } from './api.js';
import { t } from './i18n.js';

/**
 * The whole-repository menu: the three operations that name no subset.
 * The count in each label is the same one the confirmation will name.
 * @returns {React.ReactElement} the menu trigger and its rows.
 */
export function RepoBulkMenu({ status, run, confirm, busy }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const unstaged = [...status.unstaged, ...status.conflicts];
  const untracked = status.untracked;
  const staged = status.staged;
  const count = (list, key) => t(key, { n: list.length });

  const items = [];
  if (unstaged.length + untracked.length > 0) {
    items.push({ id: 'stageAll', label: count([...unstaged, ...untracked], 'repo.stageAll') });
  }
  if (staged.length > 0) items.push({ id: 'unstageAll', label: count(staged, 'repo.unstageAll') });
  if (unstaged.length > 0) {
    items.push({ type: 'separator', id: 'a' });
    items.push({ id: 'discardAll', label: count(unstaged, 'repo.discardAll'), danger: true });
  }
  if (untracked.length > 0) {
    items.push({ id: 'discardUntracked', label: count(untracked, 'repo.discardUntracked'), danger: true });
  }

  return (
    <Menu
      open={open}
      align="end"
      dense
      portal
      anchor={
        <button
          type="button"
          className="gv-btn"
          aria-expanded={open}
          aria-label={t('repo.bulk')}
          title={t('repo.bulk')}
          disabled={busy || items.length === 0}
          onClick={() => setOpen(value => !value)}
        >
          ⋯⋯
        </button>
      }
      items={items}
      onSelect={id => {
        close();
        const all = [...unstaged, ...untracked].map(file => file.path);
        if (id === 'stageAll') run({ action: 'stage', paths: all });
        else if (id === 'unstageAll') run({ action: 'unstage', paths: staged.map(file => file.path) });
        else if (id === 'discardAll') {
          confirm(
            t('risk.discardAllTitle'),
            t('risk.discardAllBody', { n: unstaged.length }),
            { action: 'discard', side: 'unstaged', paths: unstaged.map(file => file.path) },
          );
        } else if (id === 'discardUntracked') {
          confirm(
            t('risk.deleteAllTitle'),
            t('risk.deleteAllBody', { n: untracked.length }),
            { action: 'discard', side: 'untracked', paths: untracked.map(file => file.path) },
          );
        }
      }}
      onClose={close}
    />
  );
}

/**
 * Pull and sync, as two named buttons.
 * The disabled titles say which specific thing is missing rather than leaving a
 * grey button that looks broken.
 * @param {object} props - the repository facts and the action runner.
 * @returns {React.ReactElement} the two buttons.
 */
export function RemoteActions({ repo, run, busy }) {
  const noRemote = repo.hasRemote === false;
  const noUpstream = !repo.upstream;
  return (
    <span className="gv-remote">
      <button
        type="button"
        className="gv-btn"
        disabled={busy || noRemote || noUpstream}
        title={noRemote ? t('remote.noRemote') : noUpstream ? t('remote.noUpstream') : t('repo.pull')}
        aria-label={t('repo.pull')}
        onClick={() =>
          run(
            { action: 'pull' },
            { working: t('action.pulling'), done: t('action.pulled') },
          )
        }
      >
        <span aria-hidden="true">↓</span> {t('repo.pull')}
      </button>
      <button
        type="button"
        className="gv-btn"
        disabled={busy || noRemote || noUpstream}
        title={noRemote ? t('remote.noRemote') : noUpstream ? t('remote.noUpstream') : t('repo.sync')}
        aria-label={t('repo.sync')}
        onClick={() =>
          run(
            { action: 'sync' },
            { working: t('action.syncing'), done: t('action.synced') },
          )
        }
      >
        <span aria-hidden="true">⇅</span> {t('repo.sync')}
      </button>
    </span>
  );
}

/**
 * The branch picker.
 * Switching branches can carry a dirty tree with it, so the action still refuses
 * if git does and the Host reports git's own words either way.
 * @returns {React.ReactElement} the menu trigger.
 */
export function BranchMenu({ sessionId, repo, run, repoPath }) {
  const [open, setOpen] = useState(false);
  const [roster, setRoster] = useState(undefined);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setRoster(undefined);
    setCreating(false);
    readBranches(sessionId, repoPath, controller.signal)
      .then(setRoster)
      .catch(error => setRoster({ error: error.message }));
    return () => controller.abort();
  }, [sessionId, repoPath, open]);

  const locals = roster?.branches?.filter(branch => !branch.remote) ?? [];
  const remotes = roster?.branches?.filter(branch => branch.remote) ?? [];

  return (
    <Menu
      open={open}
      align="start"
      dense
      portal
      anchor={
        <button
          type="button"
          className="gv-branch"
          title={repo.upstream ?? repo.branch ?? ''}
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          {repo.detached ? `${t('branch.detached')} @ ${(repo.oid ?? '').slice(0, 7)}` : repo.branch}
          <span aria-hidden="true"> ▾</span>
        </button>
      }
      onClose={close}
    >
      {creating ? (
        <div className="gv-branch-new">
          <input
            className="gv-input"
            value={name}
            autoFocus
            placeholder={t('branch.newPlaceholder')}
            onChange={event => setName(event.target.value)}
            onKeyDown={event => {
              if (event.key !== 'Enter' || name.trim() === '') return;
              const body = { action: 'branch.create', name: name.trim() };
              setCreating(false);
              setName('');
              close();
              run(body);
            }}
          />
          <button
            type="button"
            className="gv-btn primary"
            disabled={name.trim() === ''}
            onClick={() => {
              const body = { action: 'branch.create', name: name.trim() };
              setCreating(false);
              setName('');
              close();
              run(body);
            }}
          >
            {t('branch.create')}
          </button>
        </div>
      ) : roster?.error !== undefined ? (
        <div className="gv-menu-note">{roster.error}</div>
      ) : (
        <>
          {locals.map(branch => (
            <button
              key={branch.name}
              type="button"
              className="gv-menu-row"
              disabled={branch.current}
              onClick={() => {
                close();
                run({ action: 'checkout', branch: branch.name });
              }}
            >
              <span>{branch.name}</span>
              <span className="gv-menu-meta">
                {branch.current ? t('branch.current') : ''}
                {branch.ahead > 0 ? ` ↑${branch.ahead}` : ''}
                {branch.behind > 0 ? ` ↓${branch.behind}` : ''}
              </span>
            </button>
          ))}
          {remotes.length > 0 ? (
            <div className="gv-menu-group">{t('branch.remote')}</div>
          ) : null}
          {remotes.map(branch => (
            <button
              key={branch.name}
              type="button"
              className="gv-menu-row"
              onClick={() => {
                close();
                run({ action: 'checkout', branch: branch.name });
              }}
            >
              <span>{branch.name}</span>
              <span className="gv-menu-meta">{branch.sha}</span>
            </button>
          ))}
          <button
            type="button"
            className="gv-menu-row"
            onClick={() => setCreating(true)}
            disabled={repo.detached}
          >
            {t('branch.new')}
          </button>
        </>
      )}
    </Menu>
  );
}

/**
 * The stash list, reached from the header.
 * Applying is the common case and runs directly; dropping and clearing destroy
 * the only remaining copy of that work, so both go out to the confirmation gate.
 * @returns {React.ReactElement} the menu trigger and its list.
 */
export function StashMenu({ sessionId, run, confirm, repoPath }) {
  const [open, setOpen] = useState(false);
  const [stashes, setStashes] = useState(undefined);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setStashes(undefined);
    readStashes(sessionId, repoPath, controller.signal)
      .then(answer => setStashes(answer.stashes))
      .catch(error => setStashes({ error: error.message }));
    return () => controller.abort();
  }, [sessionId, repoPath, open]);

  return (
    <Menu
      open={open}
      align="end"
      dense
      portal
      anchor={
        <button
          type="button"
          className="gv-btn"
          aria-expanded={open}
          title={t('stash.title')}
          onClick={() => setOpen(value => !value)}
        >
          {t('stash.title')}
        </button>
      }
      onClose={close}
    >
      {stashes === undefined ? (
        <div className="gv-menu-note">…</div>
      ) : Array.isArray(stashes) === false ? (
        <div className="gv-menu-note">{stashes.error}</div>
      ) : (
        <>
          {/* Creating a stash sits above the list, not inside it: a repository that has
              never been stashed would otherwise offer no way to start. */}
          <button
            type="button"
            className="gv-menu-row"
            onClick={() => {
              close();
              run({ action: 'stash.push' });
            }}
          >
            {t('stash.push')}
          </button>
          {stashes.length === 0 ? (
            <div className="gv-menu-note">{t('stash.empty')}</div>
          ) : (
            <>
              <div className="gv-menu-group">{t('stash.list')}</div>
              {stashes.map(entry => (
                <div key={entry.ref} className="gv-stash">
                  <button
                    type="button"
                    className="gv-menu-row"
                    onClick={() => {
                      close();
                      run({ action: 'stash.apply', ref: entry.ref });
                    }}
                  >
                    <span>{entry.message || entry.ref}</span>
                    <span className="gv-menu-meta">
                      {entry.branch === null ? '' : `${entry.branch} · `}
                      {t('stash.files', { n: entry.files })}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="gv-menu-row danger"
                    onClick={() => {
                      close();
                      confirm(t('risk.dropTitle'), t('risk.dropBody').replace('{entry}', entry.message || entry.ref), {
                        action: 'stash.drop',
                        ref: entry.ref,
                      });
                    }}
                  >
                    {t('stash.drop')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="gv-menu-row danger"
                onClick={() => {
                  close();
                  confirm(t('risk.clearTitle'), t('risk.clearBody'), { action: 'stash.clear' });
                }}
              >
                {t('stash.clear')}
              </button>
            </>
          )}
        </>
      )}
    </Menu>
  );
}