import { t } from './i18n.js';

/**
 * Placeholders shaped like the thing that is coming.
 * They draw the layout the answer will have — group headings, directory rows,
 * files with their counts — so the wait is legible and the real content lands
 * in place instead of shoving everything down.
 * @param {{ rows?: number, className?: string }} props - how much to draw.
 * @returns {React.ReactElement} the placeholder.
 */

/** One shimmering bar. */
function Bar({ width, className = '' }) {
  return <span className={`gv-sk-bar ${className}`} style={{ width }} />;
}

/**
 * The file list before the file list exists.
 * Three groups rather than one, because a repository that turns out to have
 * staged, unstaged and untracked files is the common case.
 * @returns {React.ReactElement} the placeholder list.
 */
export function TreeSkeleton() {
  // Indents match the real tree's, so the guides line up and nothing slides
  // sideways when the rows are replaced.
  const rows = [
    { indent: 0, name: 34 },
    { indent: 12, name: 52, counts: true },
    { indent: 24, name: 78, counts: true },
    { indent: 24, name: 61, counts: true },
    { indent: 0, name: 28 },
    { indent: 12, name: 70, counts: true },
  ];
  return (
    <div className="gv-sk" aria-hidden="true">
      {[0, 1].map(group => (
        <div className="gv-sk-group" key={group}>
          <div className="gv-sk-head">
            <Bar width="58px" />
            <Bar width="14px" />
          </div>
          {rows.slice(group * 3, group * 3 + 3).map((row, index) => (
            <div className="gv-sk-row" key={index} style={{ paddingLeft: 8 + row.indent }}>
              <Bar width="10px" className="gv-sk-mono" />
              <Bar width={`${row.name}px`} />
              <span className="gv-sk-spacer" />
              {row.counts ? (
                <>
                  <Bar width="18px" className="gv-sk-mono" />
                  <Bar width="18px" className="gv-sk-mono" />
                </>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * A comparison before the comparison exists.
 * Line numbers and text at the real rhythm, so the pane reads as "a diff is
 * loading" rather than as an empty file.
 * @returns {React.ReactElement} the placeholder.
 */
export function DiffSkeleton() {
  const widths = ['62%', '38%', '74%', '55%', '44%', '68%', '31%', '57%'];
  return (
    <div className="gv-sk" aria-hidden="true">
      <div className="gv-sk-hunk">
        <Bar width="150px" className="gv-sk-mono" />
      </div>
      {widths.map((width, index) => (
        <div className={`gv-sk-line${index < 3 ? '' : index < 5 ? ' add' : ' del'}`} key={index}>
          <Bar width="22px" className="gv-sk-mono" />
          <Bar width="22px" className="gv-sk-mono" />
          <Bar width={width} />
        </div>
      ))}
    </div>
  );
}

/**
 * A file before the file exists.
 * @returns {React.ReactElement} the placeholder.
 */
export function FileSkeleton() {
  const widths = ['48%', '66%', '39%', '71%', '52%', '60%', '35%', '58%', '45%'];
  return (
    <div className="gv-sk gv-sk-file" aria-hidden="true">
      {widths.map((width, index) => (
        <div className="gv-sk-line" key={index}>
          <Bar width="22px" className="gv-sk-mono" />
          <Bar width={width} />
        </div>
      ))}
    </div>
  );
}

/**
 * What a screen reader hears while a placeholder is on screen.
 * The shapes above are hidden from assistive technology because they carry no
 * information; without this the panel would be silent.
 * @param {{ label: string }} props - what is being read.
 * @returns {React.ReactElement} the announcement.
 */
export function LoadingAnnounce({ label }) {
  return (
    <span className="gv-sk-announce" role="status" aria-live="polite">
      {label}
    </span>
  );
}

/** The label for the file list's placeholder. */
export const treeLoading = () => t('loading.status');
/** The label for the comparison placeholder. */
export const diffLoading = () => t('loading.diff');
/** The label for the file placeholder. */
export const fileLoading = () => t('loading.file');
