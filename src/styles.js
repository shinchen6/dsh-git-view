/**
 * The Git view's stylesheet.
 * Rendered as a React element so unmounting removes it with the view. Colours
 * are theme tokens only, so the view follows both palettes.
 */
export const CSS = `
/* Every scroll region below is bounded by --gv-room, the height the composer
   leaves us, measured in JS because nothing in the slot's ancestor chain can
   know it. The 600px fallback covers the frame before the first measurement. */
.gv{--gv-room:600px;display:flex;flex-direction:column;width:100%;height:var(--gv-room);min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.gv-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);flex:0 0 auto}
.gv-repo{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gv-branch{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:2px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;white-space:nowrap}
.gv-count{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.gv-spacer{flex:1}
.gv-subnote{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px}
.gv-subnote.error{color:var(--dsw-alias-state-error-primary)}
.gv-spin{display:inline-block;animation:gv-spin .9s linear infinite}
@keyframes gv-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.gv-spin{animation:none}}
.gv-btn{font:inherit;font-size:12px;padding:3px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}
/* Interaction surfaces.
   These do not use the layer tokens: in this theme --dsw-alias-bg-layer-1 and
   -2 are both #fff, exactly the panel background, so every hover, selection,
   hunk header and field computed to white on white. Mixing the label colour
   instead is guaranteed to differ from the base in both themes. */
.gv{--gv-hover:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);
  --gv-sunken:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent);
  --gv-selected:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);
  --gv-selected-line:color-mix(in srgb,var(--dsw-alias-brand-primary) 38%,transparent)}
.gv-btn:hover{background:var(--gv-hover)}
.gv-btn[aria-pressed="true"]{background:var(--gv-selected);border-color:var(--dsw-alias-brand-primary)}
.gv-btn:disabled{opacity:.5;cursor:default}
/* Every scroll region below is sized by what is left of this box, not by the
   viewport. The composer floats over the bottom of the tab, so a 100dvh-based
   height hides the last rows behind it. */
.gv-body{display:flex;align-items:stretch;flex:1 1 auto;min-height:0}
.gv-list{flex:0 0 auto;min-width:220px;max-width:60%;display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--dsw-alias-border-l1)}
.gv-sizer{flex:0 0 5px;margin:0 -3px;cursor:col-resize;background:transparent;position:relative;z-index:3;touch-action:none}
.gv-sizer:hover,.gv-sizer:focus-visible{background:var(--dsw-alias-border-l1)}
.gv-tree-scroll{flex:1 1 auto;order:1;min-height:0;max-height:var(--gv-room);overflow:auto;outline:none}
.gv-tree-scroll:focus-visible{box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.gv-tree{min-height:0;overflow:visible;padding:4px 0}
.gv-banner{padding:6px 12px;font-size:12px;white-space:pre-wrap;word-break:break-word;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto}
.gv-banner.error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
/* Below the file list, not above it: putting the commit box first spent the
   most valuable vertical space on a text box nobody reads until the changes
   are read. */
.gv-commit{order:3;flex:0 0 auto;padding:8px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:4px;background:var(--dsw-alias-bg-base)}
/* The box, then its two actions on a row of their own: three glyph-only
   buttons in a 36px column made the disabled one read as an empty box and left
   committing as an unlabelled tick. */
.gv-commit-row{position:relative;display:flex;gap:6px;align-items:stretch}
.gv-commit-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.gv-commit-bar .gv-commit-go{flex:1 1 90px;min-width:80px}
.gv-commit-toggle{flex:0 0 28px;width:28px;padding:0}
/* At the top right, over the field's first line. Three classes on purpose: the
   shared icon-button rule is width:100% at equal specificity, so without them
   the later rule would stretch this across the field and eat clicks on the
   first line of text. */
.gv-btn.icon.gv-commit-expand{position:absolute;top:4px;right:6px;width:24px;height:24px;padding:0;border-color:transparent;background:none;color:var(--dsw-alias-label-secondary)}
.gv-commit-expand:hover{border-color:var(--dsw-alias-border-l1);background:var(--gv-hover);color:var(--dsw-alias-label-primary)}
/* Open: the field takes the panel's leftover height and the tree above it
   gives up the room. The panel grows upward, the direction the control says
   it grows. */
.gv-commit.is-open{flex:1 1 auto;min-height:0}
.gv-list:has(.gv-commit.is-open) .gv-tree-scroll{flex:0 1 auto;max-height:35%}
.gv-commit.is-open .gv-commit-row{flex:1 1 auto;min-height:0}
.gv-commit.is-open .gv-textarea{height:100%}
.gv-push-list{max-height:min(46vh,420px);overflow:auto}
.gv-push-commits{list-style:none;margin:0;padding:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
.gv-push-commit{display:flex;gap:8px;align-items:baseline;padding:4px 6px;border-radius:4px}
.gv-push-commit:nth-child(odd){background:var(--gv-sunken)}
.gv-push-sha{flex:0 0 auto;color:var(--dsw-alias-label-secondary)}
.gv-push-subject{flex:1;min-width:0;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
.gv-push-empty{margin:0;color:var(--dsw-alias-label-secondary)}
/* Push follows Commit and is sized by its own label rather than sharing the
   leftover width, so the two never read as one split button. */
.gv-commit-push{flex:0 0 auto}
.gv-commit-hint{font-size:11px;color:var(--dsw-alias-label-secondary);padding:0 2px}
.gv-commit-note{font-size:12px;color:var(--dsw-alias-label-secondary);padding:0 2px}
.gv-commit-note.error{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;word-break:break-word}
/* A finished action, where nothing else in the panel would show that it
   happened at all. Success-toned rather than neutral, because the line it
   replaces is the one that reports refusals. */
.gv-commit-note.done{color:var(--dsw-alias-state-success-primary)}
.gv-hover{position:fixed;z-index:60;pointer-events:none;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.28);overflow:hidden;font-size:12px}
.gv-hover-head{display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--gv-sunken);border-bottom:1px solid var(--dsw-alias-border-l1)}
.gv-hover-path{flex:1;min-width:0;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gv-hover-count{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.gv-hover-body{max-height:280px;overflow:hidden}
.gv-hover-line{display:flex;gap:6px;padding:0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;line-height:1.5;white-space:pre}
.gv-hover-no{width:38px;flex:0 0 auto;text-align:right;color:var(--dsw-alias-label-secondary);opacity:.6}
.gv-hover-sign{width:8px;flex:0 0 auto;text-align:center;color:var(--dsw-alias-label-secondary)}
.gv-hover-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary)}
.gv-hover-line.add{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}
.gv-hover-line.add .gv-hover-sign{color:var(--dsw-alias-state-success-primary)}
.gv-hover-line.del{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent)}
.gv-hover-line.del .gv-hover-sign{color:var(--dsw-alias-state-error-primary)}
.gv-hover-note{margin:0;padding:6px 8px;color:var(--dsw-alias-label-secondary);background:var(--gv-sunken)}
/* The checkbox appears on the row you are looking at, not on every row above
   it: always-on checkboxes draw a permanent column of empty squares down the
   tree. The slot stays reserved so names do not jump on hover. */
.gv-check{flex:0 0 auto;display:flex;align-items:center;padding:0 2px 0 8px;cursor:pointer}
.gv-check input{margin:0;cursor:pointer;accent-color:var(--dsw-alias-brand-primary);opacity:0}
.gv-row-wrap:hover .gv-check input,.gv-group-row:hover .gv-check input,.gv-check input:focus-visible,.gv-check input:checked{opacity:1}
.gv-row-wrap:has(.gv-check) .gv-row{padding-left:4px}
.gv-selection{order:2;flex:0 0 auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 8px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--gv-sunken)}
.gv-selection-count{font-size:12px;color:var(--dsw-alias-label-secondary);margin-right:2px}
/* Native resize turned off because the grip cannot be moved to the top right. */
.gv-textarea{flex:1;min-width:0;min-height:52px;resize:none;padding-right:32px;font-family:inherit;line-height:1.5}
.gv-commit-go{display:flex;align-items:center;justify-content:center;gap:5px;padding:4px 10px;font-size:12px;line-height:1.4}
.gv-commit .gv-input{flex:1;min-width:0}
.gv-btn.icon{width:100%;padding:0;height:26px;text-align:center;font-size:13px;line-height:1}
.gv-input{font:inherit;font-size:12px;padding:3px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:var(--gv-sunken);color:var(--dsw-alias-label-primary)}
.gv-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.gv-btn.primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent)}
.gv-btn.primary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary) 24%,transparent)}
.gv-btn.wide{flex:1;width:100%}
.gv-detail{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;min-height:0}
.gv-detail-head{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto;flex-wrap:wrap}
.gv-path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px}
.gv-scroll{flex:1 1 auto;min-height:0;max-height:var(--gv-room);overflow:auto}
.gv-note{padding:24px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px}
/* Loading placeholders. They hold the shape of the answer so the panel does not
   jump, and they move so a slow status call reads as work, not as a broken view. */
.gv-sk{padding:6px 0}
.gv-sk-group{margin-bottom:6px}
.gv-sk-head{display:flex;align-items:center;gap:6px;padding:5px 10px}
.gv-sk-row,.gv-sk-line{display:flex;align-items:center;gap:6px}
.gv-sk-row{height:22px}
.gv-sk-line{height:18px;padding:0 12px;gap:8px}
.gv-sk-file{padding:8px 0}
.gv-sk-hunk{padding:4px 12px;background:var(--gv-sunken)}
.gv-sk-spacer{flex:1}
.gv-sk-bar{display:block;height:9px;border-radius:4px;background:color-mix(in srgb,var(--dsw-alias-label-secondary) 30%,transparent);animation:gv-sk-pulse 1.4s ease-in-out infinite}
.gv-sk-mono{height:8px;opacity:.7}
/* Added and removed rows are tinted like the real ones, so the placeholder
   reads as a comparison rather than as generic text. */
.gv-sk-line.add .gv-sk-bar:last-child{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 26%,transparent)}
.gv-sk-line.del .gv-sk-bar:last-child{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 26%,transparent)}
/* Staggered so the rows do not pulse in unison, which reads as a blinking
   block instead of as loading. */
.gv-sk-group:nth-child(2) .gv-sk-bar{animation-delay:.18s}
.gv-sk-line:nth-child(3n) .gv-sk-bar{animation-delay:.24s}
.gv-sk-line:nth-child(3n+1) .gv-sk-bar{animation-delay:.4s}
@keyframes gv-sk-pulse{0%,100%{opacity:.45}50%{opacity:.9}}
@media (prefers-reduced-motion:reduce){.gv-sk-bar{animation:none;opacity:.6}}
.gv-sk-announce{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.gv-note.error{color:var(--dsw-alias-state-error-primary);text-align:left;white-space:pre-wrap;word-break:break-word}
.gv-note-inline{color:var(--dsw-alias-label-secondary);font-size:12px}
.gv-file.gv-image{display:flex;align-items:flex-start;justify-content:center;padding:16px}
.gv-file.gv-image img{max-width:100%;height:auto;border-radius:6px}
.gv-file.gv-image object{width:100%;height:70vh;border:0;border-radius:6px}
.gv-editor{display:flex;flex-direction:column}
/* The container this renders into is content-driven, so a percentage height
   resolves to nothing and the field collapses to a single line. */
.gv-editor-area{flex:0 0 auto;height:max(220px,var(--gv-room));font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.55;resize:vertical;border-radius:0;border-left:0;border-right:0}
.gv-editor-bar{position:sticky;bottom:0;display:flex;align-items:center;gap:10px;padding:6px 10px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);font-size:12px}
.gv-dirty{color:var(--dsw-alias-state-warn-primary)}
.gv-editor-problem{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;word-break:break-word}
.gv-editor-hint{color:var(--dsw-alias-label-secondary)}
.gv-remote{display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap}

.gv-group{margin-bottom:2px}
.gv-group-head{display:flex;align-items:center;gap:4px;padding:3px 10px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.03em;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none;background:transparent;border:0;text-align:left;font-family:inherit}
.gv-group-head:hover{background:var(--gv-hover)}
.gv-row{position:relative;display:flex;align-items:center;gap:6px;width:100%;padding:2px 10px 2px 8px;font:inherit;font-size:12px;background-color:transparent;border:0;color:inherit;cursor:pointer;text-align:left;white-space:nowrap}
/* Depth guides. Without them a path three folders down is the same list as one
   folder down, and the eye has to re-parse the indent to find the file again. */
.gv-row::before{content:'';position:absolute;top:0;bottom:0;left:8px;width:calc(var(--d,0) * 12px);pointer-events:none;background-image:repeating-linear-gradient(to right,var(--dsw-alias-border-l1) 0 1px,transparent 1px 12px);background-position:6px 0}
.gv-row:hover{background:var(--gv-hover)}
/* A left bar as well as a fill: colour alone is a weak signal for anyone who
   cannot separate these two hues, and it is what the panel this copies does. */
.gv-row[aria-selected="true"]{background:var(--gv-selected);box-shadow:inset 2px 0 0 0 var(--gv-selected-line)}
.gv-chevron{flex:0 0 12px;font-size:10px;color:var(--dsw-alias-label-secondary);text-align:center;line-height:1.4}
.gv-row.gv-dir .gv-name{font-weight:500}
.gv-row-wrap{position:relative;display:flex;align-items:stretch}
.gv-row-wrap>.gv-row{flex:1;min-width:0}
.gv-row-actions{flex:0 0 auto;display:flex;align-items:center;gap:1px;padding-right:4px;opacity:0}
.gv-row-wrap:hover .gv-row-actions,.gv-row-wrap:focus-within .gv-row-actions{opacity:1}
.gv-quick{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:14px;line-height:1}
.gv-quick:hover{background:var(--gv-hover);color:var(--dsw-alias-label-primary)}
.gv-group-row{display:flex;align-items:stretch}
.gv-group-row>.gv-group-head{flex:1;min-width:0}
.gv-group-actions{flex:0 0 auto;display:flex;align-items:center;gap:1px;padding-right:6px;opacity:0}
.gv-group-row:hover .gv-group-actions,.gv-group-row:focus-within .gv-group-actions{opacity:1}
.gv-more{flex:0 0 auto;align-self:center;width:22px;height:20px;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:13px;line-height:1}
.gv-more:hover,.gv-more[aria-expanded="true"]{background:var(--gv-hover);color:var(--dsw-alias-label-primary)}
.gv-letter{flex:0 0 12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:600;text-align:center}
.gv-letter-M{color:var(--dsw-alias-state-warn-primary)}
.gv-letter-A{color:var(--dsw-alias-state-success-primary)}
.gv-letter-D{color:var(--dsw-alias-state-error-primary)}
.gv-letter-R{color:var(--dsw-alias-brand-primary)}
.gv-letter-U{color:var(--dsw-alias-state-error-primary)}
.gv-letter-Q{color:var(--dsw-alias-label-secondary)}
.gv-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gv-dir{color:var(--dsw-alias-label-secondary)}
.gv-num{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-variant-numeric:tabular-nums}
.gv-add{color:var(--dsw-alias-state-success-primary)}
.gv-del{color:var(--dsw-alias-state-error-primary)}
.gv-flag{font-size:11px;color:var(--dsw-alias-label-secondary)}

.gv-count-hidden{margin-left:2px;padding:0 4px;border-radius:3px;font-size:10px;letter-spacing:0;color:var(--dsw-alias-label-secondary);background:var(--gv-sunken)}
.gv-hunk{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:var(--gv-sunken);color:var(--dsw-alias-label-secondary);padding:2px 12px}
.gv-line{display:flex;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px;white-space:pre}
.gv-line.add{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}
/* The whole file marks additions the same way the comparison does, so the same
   colour means the same thing in both. Unchanged lines stay unstyled: a file
   with one changed line out of two hundred should not read as two hundred. */
.gv-line.ctx .gv-text{color:var(--dsw-alias-label-secondary)}
.gv-line.add .gv-text{color:var(--dsw-alias-label-primary)}
.gv-dropped{display:flex;align-items:center;gap:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
.gv-dropped-note{flex:1;padding:0 8px;font-family:inherit}
.gv-line.del{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent)}
.gv-no{flex:0 0 48px;text-align:right;padding:0 8px;color:var(--dsw-alias-label-secondary);user-select:none;font-variant-numeric:tabular-nums}
.gv-text{flex:1;min-width:0;padding:0 8px}
.gv-line.wrap .gv-text{white-space:pre-wrap;overflow-wrap:anywhere}
.gv-split{display:flex}
.gv-split .gv-side{flex:1;min-width:0;overflow:auto}
.gv-split .gv-side+.gv-side{border-left:1px solid var(--dsw-alias-border-l1)}
.gv-file{padding:8px 12px}

.gv-menu-row{display:flex;align-items:center;gap:12px;width:100%;padding:4px 10px;font:inherit;font-size:12px;background:transparent;border:0;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left}
.gv-menu-row:hover:not(:disabled){background:var(--gv-hover)}
.gv-menu-row:disabled{opacity:.55;cursor:default}
.gv-menu-row.danger{color:var(--dsw-alias-state-error-primary)}
.gv-menu-row>span:first-child{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gv-menu-meta{flex:0 0 auto;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.gv-menu-group{padding:6px 10px 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-secondary)}
.gv-menu-note{padding:8px 10px;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word;max-width:280px}
.gv-branch-new{display:flex;gap:6px;padding:6px 10px}
.gv-stash{border-bottom:1px solid var(--dsw-alias-border-l1)}

/* The project layer sits above the commit bar: which repositories are waiting
   on something, so the answer does not require scrolling or clicking. */
.gv-projects{flex:0 0 auto;max-height:40%;overflow:auto;border-bottom:1px solid var(--dsw-alias-border-l1)}
.gv-project{display:flex;align-items:center;gap:7px;width:100%;height:22px;padding:0 10px;border:0;border-radius:0;background:none;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:22px;text-align:left;cursor:pointer}
.gv-project:hover{background:var(--dsw-alias-bg-neutral-hover)}
.gv-project.current{background:var(--dsw-alias-bg-neutral-active)}
.gv-project.current .gv-project-name{font-weight:600}
/* The dot carries the state and the dot alone: four different words beside it
   would compete with a row whose point is to be read in one glance. */
.gv-project-dot{flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}
.gv-project-dot.changed{background:var(--dsw-alias-label-secondary)}
.gv-project-dot.ready{background:var(--dsw-alias-accent-base)}
.gv-project-dot.conflict{background:var(--dsw-alias-state-error-primary)}
/* Not yet read. Hollow rather than filled: a solid dot reads as a known state,
   and this one is the absence of one. */
.gv-project-dot.pending{background:transparent;box-shadow:inset 0 0 0 1px var(--dsw-alias-label-tertiary)}
.gv-project-name{flex:0 1 auto;max-width:52%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gv-project-branch{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.gv-project-count{flex:0 0 auto;margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.gv-project:focus-visible{outline:2px solid var(--dsw-alias-accent-base);outline-offset:-2px}
/* The folded remainder. Deliberately not a project row: it is a count, and it
   must not read as one more repository waiting on something. */
.gv-project-quiet{display:flex;align-items:center;gap:6px;width:100%;height:22px;padding:0 10px;border:0;border-radius:0;background:none;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;line-height:22px;text-align:left;cursor:pointer}
.gv-project-quiet:hover{background:var(--dsw-alias-bg-neutral-hover);color:var(--dsw-alias-label-primary)}
.gv-project-caret{flex:0 0 auto;width:9px;font-size:9px;text-align:center}
`;