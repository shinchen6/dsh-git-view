/**
 * The project layer: which of the working directory's repositories need you.
 *
 * A working directory can hold a dozen repositories and usually one or two are
 * waiting on something. Listing all of them buries the answer in the question,
 * and on a real workspace the panel was mostly a list of projects that were
 * fine. Projects with something waiting are therefore the list, and the quiet
 * ones are folded into one line that says how many there are and opens to name
 * them — absent would be indistinguishable from forgotten, but a count is not.
 */

import { useState } from 'react';
import { t } from './i18n.js';

/**
 * What one project row reports about the work waiting there.
 *
 * A repository whose changes are all in the working tree is not the same as one
 * whose changes are staged: only the second can be committed, and collapsing
 * both into "changed" puts a row beside a commit button that does nothing.
 *
 * @param {object} entry - one project summary.
 * @returns {string} the count, already translated.
 */
function projectCount(entry) {
  const ready = entry.staged + entry.conflicts;
  if (ready > 0) return t('projects.stagedCount', { count: ready });
  if (entry.unstaged > 0) return t('projects.unstagedCount', { count: entry.unstaged });
  return t('projects.untrackedCount', { count: entry.untracked });
}

/**
 * The branch column.
 *
 * A repository with no commits reports its literal name as `HEAD`, which would
 * render as a broken branch; it is named for what it is instead.
 *
 * @param {object} entry - one project summary.
 * @returns {string} the branch label.
 */
function projectBranch(entry) {
  if (entry.unborn === true) return t('projects.noCommits');
  if (entry.branch === null || entry.branch === undefined) return t('projects.detached');
  return entry.branch;
}

/**
 * The dot that carries a project's state.
 *
 * The dot carries the state and the dot alone: four different words beside it
 * would compete with a row whose point is to be read in one glance.
 *
 * @param {string} state - one of the four states, or `pending`.
 * @returns {React.ReactElement} the dot.
 */
function Dot({ state }) {
  return <span className={`gv-project-dot ${state}`} aria-hidden="true" />;
}

/**
 * One project, as a row that selects it.
 *
 * A button and never a checkbox: the directory rows below stage what they name,
 * and a project-level box would read as permission to stage across
 * repositories, which commits never do.
 *
 * @param {object} props - the row's props.
 * @param {{ path: string, name: string }} props.entry - the project.
 * @param {object | undefined} props.summary - what is waiting there, once known.
 * @param {boolean} props.current - whether this is the project being shown.
 * @param {(path: string) => void} props.onSelect - make a project current.
 * @returns {React.ReactElement} the row.
 */
function ProjectRow({ entry, summary, current, onSelect }) {
  // A project whose state has not arrived is still a project. Saying nothing
  // about it would read as "clean" rather than "not yet known", which is the
  // one thing this layer exists not to get wrong.
  const pending = summary === undefined;
  const state = pending ? 'pending'
    : summary.conflicts > 0 ? 'conflict'
      : summary.clean ? 'clean'
        : summary.staged > 0 ? 'ready'
          : 'changed';
  const count = pending ? t('projects.reading')
    : summary.clean ? t('projects.clean')
      : projectCount(summary);

  return (
    <button
      type="button"
      className={`gv-project${current ? ' current' : ''}`}
      aria-current={current}
      title={entry.path}
      onClick={() => onSelect(entry.path)}
    >
      <Dot state={state} />
      <span className="gv-project-name">{entry.name}</span>
      <span className="gv-project-branch">{pending ? '' : projectBranch(summary)}</span>
      <span className="gv-project-count">{count}</span>
    </button>
  );
}

/**
 * The layer: the projects waiting on something, then the quiet ones folded.
 *
 * @param {object} props - the layer's props.
 * @param {object[] | undefined} props.projects - the discovered projects.
 * @param {object[] | undefined} props.summaries - what is waiting in each.
 * @param {string | undefined} props.current - the project being shown.
 * @param {(path: string) => void} props.onSelect - make a project current.
 * @returns {React.ReactElement | null} the layer, or nothing when there is one project.
 */
export function ProjectLayer({ projects, summaries, current, onSelect }) {
  const [showQuiet, setShowQuiet] = useState(false);

  // One project needs no choosing between, and a layer over a single row is a
  // row the user cannot do anything with.
  if (projects === undefined || projects.length < 2) return null;

  const states = new Map((summaries ?? []).map(entry => [entry.path, entry]));
  const busy = [];
  const quiet = [];
  for (const entry of projects) {
    const summary = states.get(entry.path);
    // Unread counts as busy: it may well be the project that needs attention,
    // and folding it away would hide it exactly while it is unknown.
    if (summary === undefined || !summary.clean) busy.push(entry);
    else quiet.push(entry);
  }

  // The project being shown is never hidden, even when it is the quiet one.
  const shownQuiet = quiet.filter(entry => showQuiet || entry.path === current);

  return (
    <div className="gv-projects" role="group" aria-label={t('projects.label')}>
      {busy.map(entry => (
        <ProjectRow
          key={entry.path}
          entry={entry}
          summary={states.get(entry.path)}
          current={entry.path === current}
          onSelect={onSelect}
        />
      ))}
      {shownQuiet.map(entry => (
        <ProjectRow
          key={entry.path}
          entry={entry}
          summary={states.get(entry.path)}
          current={entry.path === current}
          onSelect={onSelect}
        />
      ))}
      {quiet.length > 0 && (
        <button
          type="button"
          className="gv-project-quiet"
          aria-expanded={showQuiet}
          onClick={() => setShowQuiet(value => !value)}
        >
          <span className="gv-project-caret" aria-hidden="true">{showQuiet ? '▾' : '▸'}</span>
          {t('projects.quietCount', { count: quiet.length })}
        </button>
      )}
    </div>
  );
}
