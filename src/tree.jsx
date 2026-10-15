import { DirActions, GroupActions, RowActions } from './actions.jsx';
import { useEffect } from 'react';

import { buildTree, sideOf } from './treebuild.js';
import { t } from './i18n.js';

export { buildTree };

/** Status letters, one tone each, read with the same weight everywhere. */
const LETTERS = {
  M: 'gv-letter-M',
  A: 'gv-letter-A',
  D: 'gv-letter-D',
  R: 'gv-letter-R',
  C: 'gv-letter-C',
  U: 'gv-letter-U',
  '?': 'gv-letter-Q',
};

/** One indentation step, in pixels; the tree is read by these offsets. */
const INDENT = 12;

/**
 * The line counts a row shows.
 * A row with nothing to count shows nothing; an untracked file's `?` in the
 * status column already carries that.
 * @param {object[]} files - the files a row stands for.
 * @returns {React.ReactElement[]} the count elements.
 */
function Counts({ files }) {
  let added = 0;
  let removed = 0;
  let binary = false;
  for (const file of files) {
    added += file.added ?? 0;
    removed += file.deleted ?? 0;
    if (file.binary) binary = true;
  }
  const out = [];
  if (added > 0) out.push(`+${added}`);
  if (removed > 0) out.push(`-${removed}`);
  if (binary) out.push(t('status.binary'));
  return out.map(text => (
    <span
      key={text}
      className={`gv-num ${text.startsWith('+') ? 'gv-add' : text.startsWith('-') ? 'gv-del' : 'gv-flag'}`}
    >
      {text}
    </span>
  ));
}

/**
 * Sort a node's children the way a file tree reads: directories first, then
 * files, each group by name.
 * @param {object} node - a tree node.
 * @returns {void} sorts the node in place.
 */
function sortNode(node) {
  node.dirs.sort((a, b) => a.name.localeCompare(b.name));
  node.files.sort((a, b) => a.name.localeCompare(b.name));
  for (const dir of node.dirs) sortNode(dir);
}

/**
 * Collect the files a tree currently shows, in the order the eye reads them.
 * @param {object} node - the subtree to walk.
 * @param {Set<string>} collapsed - the folded directory keys.
 * @param {string} side - the side the subtree belongs to.
 * @param {object[]} into - the accumulator.
 * @returns {void} appends to `into`.
 */
function collectVisible(node, collapsed, side, into) {
  for (const file of node.files) into.push({ ...file, side: sideOf(file, side) });
  for (const dir of node.dirs) {
    if (collapsed.has(`${side}:${dir.path}`)) continue;
    collectVisible(dir, collapsed, side, into);
  }
}

/**
 * The flat order the arrow keys walk, across every visible group.
 * @param {object} status - the whole working-tree status.
 * @param {Set<string>} collapsed - the folded groups and directories.
 * @returns {object[]} one entry per visible file, in reading order.
 */
export function visibleOrder(status, collapsed) {
  const groups = [
    ['conflicts', 'unstaged', status.conflicts],
    ['staged', 'staged', status.staged],
    ['unstaged', 'unstaged', status.unstaged],
  ];
  const order = [];
  for (const [key, side, files] of groups) {
    if (collapsed.has(key)) continue;
    const root = buildTree(files);
    sortNode(root);
    collectVisible(root, collapsed, side, order);
  }
  return order;
}

/**
 * One file row: its letter, its name indented to its depth, and its counts.
 * @returns {React.ReactElement} the row and its controls.
 */
function FileRow({ file, side, depth, selected, onSelect, actions, hover, checked, onCheck }) {
  const letter = LETTERS[file.status] ?? 'gv-letter-M';
  const isChecked = checked.has(file.path);
  return (
    <div className="gv-row-wrap">
      {onCheck === undefined ? null : (
        <label className="gv-check" title={t('selection.checkTitle')}>
          <input
            type="checkbox"
            checked={isChecked}
            aria-label={file.path}
            onChange={() => onCheck(file.path)}
          />
        </label>
      )}
      <button
        type="button"
        className="gv-row"
        style={{ paddingLeft: 8 + depth * INDENT, '--d': depth }}
        aria-selected={selected?.path === file.path && selected?.side === side}
        onClick={() => onSelect({ ...file, side })}
        title={file.path}
        {...(hover === undefined ? {} : hover.bind(file, side, letter))}
      >
        <span className="gv-chevron" aria-hidden="true" />
        <span className={`gv-letter ${letter}`} aria-hidden="true">
          {file.status}
        </span>
        <span className="gv-name">{file.name}</span>
        <Counts files={[file]} />
      </button>
      <RowActions file={file} side={side} run={actions.run} confirm={actions.confirm} />
    </div>
  );
}

/**
 * One directory row, and the subtree it folds.
 * A directory carries no status letter of its own; the counts beside its name
 * are the summary, and reserving the column keeps folder and file names aligned.
 * @returns {React.ReactElement} the row and, when open, its children.
 */
function DirRow({ dir, side, depth, collapsed, onToggle, selected, onSelect, actions, hover, checked, onCheck, expand }) {
  const key = `${side}:${dir.path}`;
  const open = !collapsed.has(key);

  // A directory the status scan reported without its contents: known to exist
  // and nothing else, so opening it has to go and ask.
  const wantsContents = dir.all.some(file => file.dir === true);
  const info = expand?.state.get(dir.path);
  const loading = open && wantsContents && info?.loading === true;
  const failed = open && wantsContents && info?.failure !== undefined;

  useEffect(() => {
    if (open && wantsContents && info === undefined) expand?.request(dir.path);
  }, [open, wantsContents, info, dir.path, expand]);

  return (
    <>
      <div className="gv-row-wrap">
        <button
          type="button"
          className="gv-row gv-dir"
          style={{ paddingLeft: 8 + depth * INDENT, '--d': depth }}
          aria-expanded={open}
          onClick={() => onToggle(key)}
          title={dir.path}
        >
          <span className="gv-chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          <span className="gv-letter" aria-hidden="true" />
          <span className="gv-name">{dir.name}</span>
          <Counts files={dir.all} />
          {/* A directory that answered with more files than it sent says how many
              it kept, so the row does not read as the whole story. */}
          {info?.truncated === true ? (
            <span className="gv-num gv-add">+{info.total - (info.files?.length ?? 0)}</span>
          ) : null}
        </button>
        <DirActions
          side={side}
          files={dir.all}
          paths={dir.all.map(file => file.path)}
          run={actions.run}
          confirm={actions.confirm}
        />
      </div>
      {loading ? (
        <div className="gv-row gv-subnote" style={{ paddingLeft: 8 + (depth + 1) * INDENT }}>
          <span className={`gv-spin`} aria-hidden="true">
            ⟳
          </span>{' '}
          {t('tree.reading')}
        </div>
      ) : null}
      {failed ? (
        <div className="gv-row gv-subnote error" style={{ paddingLeft: 8 + (depth + 1) * INDENT }}>
          {info.failure}
        </div>
      ) : null}
      {open ? (
        <TreeLevel
          node={dir}
          side={side}
          depth={depth + 1}
          {...{ collapsed, onToggle, selected, onSelect, actions, hover, checked, onCheck, expand }}
        />
      ) : null}
    </>
  );
}

/**
 * One directory's children: its subdirectories, then its files.
 * @returns {React.ReactElement} the children.
 */
function TreeLevel({ node, side, depth, collapsed, onToggle, selected, onSelect, actions, hover, checked, onCheck, expand }) {
  return (
    <>
      {node.dirs.map(dir => (
        <DirRow
          key={dir.path}
          dir={dir}
          side={side}
          depth={depth}
          collapsed={collapsed}
          onToggle={onToggle}
          selected={selected}
          onSelect={onSelect}
          actions={actions}
          hover={hover}
          checked={checked}
          onCheck={onCheck}
          expand={expand}
        />
      ))}
      {node.files.map(file => (
        <FileRow
          key={file.path}
          file={file}
          side={side}
          depth={depth}
          selected={selected}
          onSelect={onSelect}
          actions={actions}
          hover={hover}
          checked={checked}
          onCheck={onCheck}
        />
      ))}
    </>
  );
}

/**
 * One collapsible side of the tree: a heading with its count and its bulk
 * actions, then the directory tree beneath it.
 * @returns {React.ReactElement} the section.
 */
function FileGroup({ title, files, side, selected, onSelect, open, onToggle, collapsed, onToggleDir, actions, hover, checked, onCheck, total, expand }) {
  if (files.length === 0) return null;
  const root = buildTree(files);
  sortNode(root);
  // The header says how many files it did not list; otherwise
  // "Untracked (500)" reads as an exact count and nothing says otherwise.
  const hidden = (total ?? files.length) - files.length;
  return (
    <section className="gv-group">
      <div className="gv-group-row">
        <button type="button" className="gv-group-head" onClick={onToggle} aria-expanded={open}>
          <span className="gv-chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          <span>
            {title} ({total ?? files.length})
          </span>
          {hidden > 0 ? <span className="gv-count-hidden">+{hidden}</span> : null}
        </button>
        <GroupActions
          side={side}
          files={files}
          paths={files.map(file => file.path)}
          run={actions.run}
          confirm={actions.confirm}
        />
      </div>
      {open ? (
        <TreeLevel
          node={root}
          side={side}
          depth={0}
          collapsed={collapsed}
          onToggle={onToggleDir}
          selected={selected}
          onSelect={onSelect}
          actions={actions}
          hover={hover}
          checked={checked}
          onCheck={onCheck}
          expand={expand}
        />
      ) : null}
    </section>
  );
}

/**
 * The file list: conflicts first, then staged, then the working tree.
 *
 * Three groups, which is what VSCode shows with its default settings. Untracked
 * files are in the working tree group rather than one of their own, told apart
 * by the `?` on each row.
 * @returns {React.ReactElement} the tree.
 */
export function FileTree({ status, selected, onSelect, collapsed, onToggle, onToggleDir, actions, hover, checked, onCheck, expand }) {
  const groups = [
    { key: 'conflicts', side: 'unstaged', title: t('group.conflicts'), files: status.conflicts },
    { key: 'staged', side: 'staged', title: t('group.staged'), files: status.staged },
    { key: 'unstaged', side: 'unstaged', title: t('group.unstaged'), files: status.unstaged },
  ];
  return (
    <div className="gv-tree" role="tree">
      {groups.map(group => (
        <FileGroup
          key={group.key}
          title={group.title}
          side={group.side}
          files={group.files}
          total={status.counts?.[group.key]?.total}
          selected={selected}
          onSelect={onSelect}
          open={!collapsed.has(group.key)}
          onToggle={() => onToggle(group.key)}
          collapsed={collapsed}
          onToggleDir={onToggleDir}
          actions={actions}
          hover={hover}
          checked={checked}
          onCheck={onCheck}
          expand={expand}
        />
      ))}
    </div>
  );
}
