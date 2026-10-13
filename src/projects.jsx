/**
 * The project layer: every repository the working directory offers, always.
 */

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
 * Every project, one row each, the current one marked.
 *
 * Projects with nothing to commit are listed and marked quiet rather than
 * dropped. An absent row cannot be told apart from one that was forgotten, and
 * the question this panel usually answers is "which of my projects needs me",
 * which a list of only the busy ones cannot answer.
 *
 * Each row is a button that makes that project current, and carries no
 * checkbox: the directory rows below stage what they name, and a project-level
 * box would read as permission to stage across repositories — which commits
 * never do.
 *
 * @param {object} props - the layer's props.
 * @param {object[] | undefined} props.projects - the discovered projects, each with a path and a name.
 * @param {object[] | undefined} props.summaries - what is waiting in each, keyed by path.
 * @param {string | undefined} props.current - the project being shown.
 * @param {(path: string) => void} props.onSelect - make a project current.
 * @returns {React.ReactElement | null} the layer, or nothing when there is one project.
 */
export function ProjectLayer({ projects, summaries, current, onSelect }) {
  // One project needs no choosing between, and a layer over a single row is a
  // row the user cannot do anything with.
  if (projects === undefined || projects.length < 2) return null;

  const states = new Map((summaries ?? []).map(entry => [entry.path, entry]));

  return (
    <div className="gv-projects" role="group" aria-label={t('projects.label')}>
      {projects.map(entry => {
        const summary = states.get(entry.path);
        // A project whose state has not arrived is still a project. Saying
        // nothing about it would read as "clean" rather than "not yet known",
        // which is the one thing this layer exists not to get wrong.
        const pending = summary === undefined;
        const state = pending ? 'pending'
          : summary.conflicts > 0 ? 'conflict'
            : summary.clean ? 'clean'
              : summary.staged > 0 ? 'ready'
                : 'changed';
        return (
          <button
            key={entry.path}
            type="button"
            className={`gv-project${entry.path === current ? ' current' : ''}`}
            aria-current={entry.path === current}
            title={entry.path}
            onClick={() => onSelect(entry.path)}
          >
            <span className={`gv-project-dot ${state}`} aria-hidden="true" />
            <span className="gv-project-name">{entry.name}</span>
            <span className="gv-project-branch">{pending ? '' : projectBranch(summary)}</span>
            <span className="gv-project-count">
              {pending ? t('projects.reading') : summary.clean ? t('projects.clean') : projectCount(summary)}
            </span>
          </button>
        );
      })}
    </div>
  );
}