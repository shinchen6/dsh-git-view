import { useCallback, useEffect, useRef, useState } from 'react';

import { readDiff } from './api.js';
import { unifiedRows } from './diff.jsx';
import { t } from './i18n.js';

/**
 * How long the pointer must rest on a row before the diff is fetched.
 * A fetch on enter would fire for every row the pointer crosses on its way
 * somewhere; resting is the signal that the read was wanted.
 */
const HOVER_DELAY_MS = 450;

/** Lines shown in the card. A preview that scrolls is a panel inside a panel. */
const MAX_LINES = 60;

/**
 * The diff preview that follows the pointer.
 * @param {object} props - the hovered file, its side, the pointer position, and the session.
 * @returns {React.ReactElement | null} the card, or nothing while it is still nothing.
 */
export function HoverCard({ hover, sessionId, onDismiss }) {
  const [diff, setDiff] = useState(undefined);
  const [failed, setFailed] = useState(false);
  const cardRef = useRef(undefined);

  // What the card is about, not where the pointer is. These change at very
  // different rates, and keying the fetch on the wrong one resets the timer on
  // every sweep and the preview never arrives.
  const target = hover === undefined ? undefined : `${hover.side}${hover.file.path}`;
  const targetPath = hover?.file.path;
  const targetSide = hover?.side;

  useEffect(() => {
    if (target === undefined) return undefined;
    let current = true;
    setDiff(undefined);
    setFailed(false);
    const timer = setTimeout(async () => {
      try {
        const answer = await readDiff(sessionId, targetPath, targetSide);
        if (!current) return;
        setDiff(answer);
      } catch {
        if (!current) return;
        // A hover card is a bonus: if it cannot be read the row is still there,
        // so the failure is a line of text rather than an error worth reading.
        setFailed(true);
      }
    }, HOVER_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [target, targetPath, targetSide, sessionId]);

  useEffect(() => {
    if (hover === undefined) return undefined;
    const onKey = event => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hover, onDismiss]);

  if (hover === undefined) return null;

  // The same normalizer the main diff view uses, so a hover and a click
  // cannot disagree about what a line is.
  const rows = (diff?.hunks ?? []).flatMap(hunk => unifiedRows(hunk));
  const shown = rows.slice(0, MAX_LINES);
  const rest = rows.length - shown.length;
  const added = rows.filter(row => row.kind === 'add').length;
  const removed = rows.filter(row => row.kind === 'del').length;

  // Flipped to the other side of the pointer when it would otherwise run
  // off the right or bottom edge, because the pointer is the thing that moves.
  const width = 460;
  const margin = 16;
  const flipX = hover.x + width + margin * 3 > globalThis.innerWidth;
  const flipY = hover.y + 320 > globalThis.innerHeight;
  const left = flipX ? Math.max(margin, hover.x - width - margin) : hover.x + margin;
  const top = flipY ? Math.max(margin, hover.y - 280) : hover.y + margin;

  return (
    <div
      ref={cardRef}
      className="gv-hover"
      style={{ left: `${left}px`, top: `${top}px`, width: `${width}px` }}
      role="tooltip"
    >
      <div className="gv-hover-head">
        <span className={`gv-letter ${hover.letter}`} aria-hidden="true">
          {hover.file.status}
        </span>
        <span className="gv-hover-path" title={hover.file.path}>
          {hover.file.name}
        </span>
        <span className="gv-hover-count">
          {/* Nothing until the diff lands: counting zero lines that have not
              arrived reads as "this file has no changes". */}
          {diff === undefined || rows.length === 0 ? '' : `+${added} −${removed}`}
        </span>
      </div>
      {failed ? (
        <p className="gv-hover-note">{t('preview.hoverFailed')}</p>
      ) : diff === undefined ? (
        <p className="gv-hover-note">{t('preview.hoverLoading')}</p>
      ) : rows.length === 0 ? (
        <p className="gv-hover-note">{t('preview.hoverEmpty')}</p>
      ) : (
        <>
          <div className="gv-hover-body">
            {shown.map((row, index) => (
              <div key={`${row.old}:${row.new}:${index}`} className={`gv-hover-line ${row.kind}`}>
                <span className="gv-hover-no">{row.kind === 'add' ? row.new : row.old}</span>
                <span className="gv-hover-sign" aria-hidden="true">
                  {row.kind === 'add' ? '+' : row.kind === 'del' ? '-' : ' '}
                </span>
                <span className="gv-hover-text">{row.text}</span>
              </div>
            ))}
          </div>
          {rest > 0 ? <p className="gv-hover-note">{t('preview.hoverMore', { n: rest })}</p> : null}
        </>
      )}
    </div>
  );
}

/**
 * Hover state for the file list.
 * Kept beside the tree rather than inside each row so moving between rows is one
 * state change in one place instead of a timer per row.
 * @returns {object} the handlers to spread onto a row, and the card to render.
 */
export function useFileHover(sessionId) {
  const [hover, setHover] = useState(undefined);
  const onEnter = useCallback((file, side, letter, event) => {
    setHover({ file, side, letter, x: event.clientX, y: event.clientY });
  }, []);
  // The card follows the pointer only while it is already open: a closed card
  // must not chase the cursor across the panel.
  const onMove = useCallback(event => {
    setHover(current => (current === undefined ? current : { ...current, x: event.clientX, y: event.clientY }));
  }, []);
  const onLeave = useCallback(() => setHover(undefined), []);
  const dismiss = useCallback(() => setHover(undefined), []);
  const bind = useCallback(
    (file, side, letter) => ({
      onMouseEnter: event => onEnter(file, side, letter, event),
      onMouseMove: onMove,
      onMouseLeave: onLeave,
    }),
    [onEnter, onMove, onLeave],
  );

  return {
    hover,
    bind,
    dismiss,
    card: <HoverCard hover={hover} sessionId={sessionId} onDismiss={dismiss} />,
  };
}
