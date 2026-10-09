import { t } from './i18n.js';
import { DiffSkeleton, FileSkeleton, LoadingAnnounce, diffLoading, fileLoading } from './skeleton.jsx';

/** Maximum rendered lines before a comparison is cut and the rest reported. */
const MAX_LINES = 5000;

/**
 * Number a hunk's lines for the unified view.
 * @param {object} hunk - one served hunk.
 * @returns {object[]} rows carrying both line numbers.
 */
export function unifiedRows(hunk) {
  const rows = [];
  let oldNo = hunk.oldStart;
  let newNo = hunk.newStart;
  for (const line of hunk.lines) {
    const kind = line[0] === '+' ? 'add' : line[0] === '-' ? 'del' : 'context';
    rows.push({
      kind,
      old: kind === 'add' ? undefined : oldNo++,
      new: kind === 'del' ? undefined : newNo++,
      text: line.slice(1),
    });
  }
  return rows;
}

/**
 * Pair a hunk's lines for the side-by-side view: each run of deletions aligns
 * with the run of additions that follows it, row by row.
 *
 * @param {object} hunk - one served hunk.
 * @returns {object[]} rows carrying at most one line per side.
 */
export function splitRows(hunk) {
  const rows = [];
  let oldNo = hunk.oldStart;
  let newNo = hunk.newStart;
  let pending = [];
  const flush = () => {
    for (const line of pending) rows.push({ left: { no: oldNo++, text: line.slice(1), kind: 'del' } });
    pending = [];
  };
  for (const line of hunk.lines) {
    const kind = line[0] === '+' ? 'add' : line[0] === '-' ? 'del' : 'context';
    const text = line.slice(1);
    if (kind === 'del') pending.push(line);
    else if (kind === 'add') {
      rows.push({ right: { no: newNo++, text, kind: 'add' } });
    } else {
      flush();
      rows.push({
        left: { no: oldNo++, text, kind: 'context' },
        right: { no: newNo++, text, kind: 'context' },
      });
    }
  }
  // A trailing deletion run has no additions to pair with.
  for (const line of pending) rows.push({ left: { no: oldNo++, text: line.slice(1), kind: 'del' } });
  return rows;
}

/**
 * Cut a comparison at {@link MAX_LINES} rendered lines.
 *
 * @param {object[]} hunks - served hunks.
 * @returns {{ hunks: object[], truncated: boolean }} what to draw.
 */
export function capHunks(hunks) {
  const kept = [];
  let budget = MAX_LINES;
  let truncated = false;
  for (const hunk of hunks) {
    if (budget <= 0) {
      truncated = true;
      break;
    }
    if (hunk.lines.length > budget) {
      kept.push({ ...hunk, lines: hunk.lines.slice(0, budget) });
      truncated = true;
      break;
    }
    budget -= hunk.lines.length;
    kept.push(hunk);
  }
  return { hunks: kept, truncated };
}

/** One numbered line in the unified layout. */
function UnifiedLine({ row, wrap }) {
  return (
    <div className={`gv-line ${row.kind}${wrap ? ' wrap' : ''}`}>
      <span className="gv-no">{row.old ?? ''}</span>
      <span className="gv-no">{row.new ?? ''}</span>
      <span className="gv-text">{row.text || ' '}</span>
    </div>
  );
}

/** One numbered line on one side of the split layout. */
function SideLine({ line, wrap }) {
  if (line === undefined) return <div className="gv-line" />;
  return (
    <div className={`gv-line ${line.kind}${wrap ? ' wrap' : ''}`}>
      <span className="gv-no">{line.no}</span>
      <span className="gv-text">{line.text || ' '}</span>
    </div>
  );
}

/**
 * The whole file, with the change marked inside it.
 * Line numbers are the new file's, which is why removed lines are reported as a
 * marker rather than drawn inline: inserting them would shift every number below.
 * @param {object} props - the file text, the change marks, and the wrap choice.
 * @returns {React.ReactElement} the file.
 */
export function WholeFileView({ data, marks, wrap }) {
  if (data === undefined) {
    return (
      <>
        <LoadingAnnounce label={fileLoading()} />
        <FileSkeleton />
      </>
    );
  }
  if (data.kind === 'error') return <div className="gv-note error">{data.message}</div>;
  if (data.kind === 'binary') return <div className="gv-note">{t('status.binary')}</div>;
  if (data.kind === 'oversized') return <div className="gv-note">{t('status.oversized')}</div>;

  const lines = String(data.text ?? '').split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  const isAdded = new Set(marks?.added ?? []);
  // Deletions are anchored to the line they preceded, so they are gathered into a
  // lookup and drawn above that line rather than tracked as rows are emitted.
  const dropped = new Map((marks?.removed ?? []).map(block => [block.at, block.count]));
  const capped = lines.slice(0, MAX_LINES);

  return (
    <div>
      {capped.map((text, index) => {
        const no = index + 1;
        const marker = dropped.get(no - 1);
        return (
          <div key={no}>
            {marker === undefined ? null : (
              <div className="gv-dropped">
                <span className="gv-no">{no - 1}</span>
                <span className="gv-dropped-note">
                  {t('diff.removed', { n: marker })}
                </span>
              </div>
            )}
            <div className={`gv-line${isAdded.has(no) ? ' add' : ' ctx'}${wrap ? ' wrap' : ''}`}>
              <span className="gv-no">{''}</span>
              <span className="gv-no">{no}</span>
              <span className="gv-text">{text || ' '}</span>
            </div>
          </div>
        );
      })}
      {/* A file that ends in deletions reports them last: they belong after the
          final line, and there is no line below to hang them under. */}
      {dropped.has(capped.length) ? (
        <div className="gv-dropped">
          <span className="gv-no">{capped.length}</span>
          <span className="gv-dropped-note">{t('diff.removed', { n: dropped.get(capped.length)})}</span>
        </div>
      ) : null}
      {lines.length > MAX_LINES ? <div className="gv-note">{t('status.oversized')}</div> : null}
    </div>
  );
}

/**
 * Render one file's comparison.
 * @param {object} props - the served diff and the layout choices.
 * @returns {React.ReactElement} the comparison, or the refusal that replaces it.
 */
export function DiffView({ data, split, wrap, whole, added, removed }) {
  // Undefined is the only state that means "not read yet": selecting another
  // file clears it, and a skeleton keeps a long read from reading as an empty pane.
  if (data === undefined) {
    return (
      <>
        <LoadingAnnounce label={diffLoading()} />
        <DiffSkeleton />
      </>
    );
  }
  if (data.kind === 'error') return <div className="gv-note error">{data.message}</div>;
  if (data.kind === 'binary') return <div className="gv-note">{t('status.binary')}</div>;
  if (data.kind === 'oversized') return <div className="gv-note">{t('status.oversized')}</div>;
  if (data.hunks.length === 0) return <div className="gv-note">{t('empty.clean')}</div>;

  const { hunks, truncated } = capHunks(data.hunks);
  return (
    <div>
      {hunks.map((hunk, index) => (
        <div key={index}>
          <div className="gv-hunk">
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </div>
          {split
            ? splitRows(hunk).map((row, line) => (
                <div className="gv-split" key={line}>
                  <div className="gv-side">
                    <SideLine line={row.left} wrap={wrap} />
                  </div>
                  <div className="gv-side">
                    <SideLine line={row.right} wrap={wrap} />
                  </div>
                </div>
              ))
            : unifiedRows(hunk).map((row, line) => <UnifiedLine key={line} row={row} wrap={wrap} />)}
        </div>
      ))}
      {truncated ? <div className="gv-note">{t('status.oversized')}</div> : null}
    </div>
  );
}