/** Turning a flat status list into a folder tree. */

/**
 * The key a folded directory is recorded under.
 *
 * Two places have to agree on this spelling exactly: the tree, which skips a
 * directory it finds here, and the view, which writes the key when a directory
 * is folded shut. They used to spell it separately, and when the untracked files
 * moved into the Changes group only the writer was updated — so every untracked
 * folder came up expanded and the tree listed everything inside them without
 * ever asking to.
 * @param {string} side - the side the directory hangs from.
 * @param {string} path - the directory's node path.
 * @returns {string} the key.
 */
export const dirKey = (side, path) => `${side}:${path}`;

/**
 * Which side of the working tree a row is discarded from.
 *
 * Untracked files share the Changes group with the tracked ones, so the group
 * cannot answer this — but the row's `?` can, and it has to: throwing away an
 * edit is `git checkout`, while throwing away a file git never knew about is
 * `git clean`, which deletes it. Reading the side off the group instead would
 * offer to restore a file that was never there.
 * @param {object} file - the status row.
 * @param {string} side - the side its group belongs to.
 * @returns {string} `untracked`, `staged`, or `unstaged`.
 */
export function sideOf(file, side) {
  if (side === 'unstaged' && file.status === '?') return 'untracked';
  return side;
}

/**
 * Build the directory tree for one side of the working tree.
 * Directories are real nodes, not a prefix drawn into a file name: a folder can
 * be folded away, and folding it has to take its whole subtree with it.
 * An untracked *directory* the status scan named without descending is a node
 * known to exist and nothing more: it joins its own file list and adds no children.
 * @param {object[]} files - status rows for one side.
 * @returns {object} the root node, whose `dirs` and `files` are in insertion order.
 */
export function buildTree(files) {
  const root = { name: '', path: '', dirs: [], files: [], all: [] };
  const index = new Map([['', root]]);

  const dirNode = path => {
    const parts = path.replace(/\/+$/, '').split('/');
    let parent = root;
    for (let depth = 0; depth < parts.length; depth += 1) {
      const here = parts.slice(0, depth + 1).join('/');
      let dir = index.get(here);
      if (dir === undefined) {
        dir = { name: parts[depth], path: here, dirs: [], files: [], all: [] };
        index.set(here, dir);
        parent.dirs.push(dir);
      }
      parent = dir;
    }
    return parent;
  };

  for (const file of files) {
    if (file.dir === true) {
      dirNode(file.path).all.push(file);
      continue;
    }
    const parts = file.path.split('/');
    let parent = root;
    for (let depth = 0; depth < parts.length - 1; depth += 1) {
      const path = parts.slice(0, depth + 1).join('/');
      let dir = index.get(path);
      if (dir === undefined) {
        dir = { name: parts[depth], path, dirs: [], files: [], all: [] };
        index.set(path, dir);
        parent.dirs.push(dir);
      }
      dir.all.push(file);
      parent = dir;
    }
    const leaf = { ...file, name: parts[parts.length - 1] };
    parent.files.push(leaf);
    // No second `parent.all.push`: the loop above already appended this file to
    // every folder on the way down, and appending again doubled the folder totals.
  }
  return root;
}