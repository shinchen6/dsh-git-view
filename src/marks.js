/** Where the change falls inside the resulting file. */

/**
 * Mark which lines of the new file differ.
 * Deletions are reported separately, not drawn inline: the removed lines do not
 * exist in the new file, so drawing them would shift every number below.
 * @param {object[]} hunks - parsed hunks, in order.
 * @returns {{ added: number[], removed: { at: number, count: number }[] }} the marks.
 */
export function markChanges(hunks) {
  const added = [];
  const removed = [];
  for (const hunk of hunks ?? []) {
    let next = hunk.newStart;
    let block;
    for (const line of hunk.lines ?? []) {
      const prefix = line[0];
      if (prefix === '+') {
        added.push(next);
        next += 1;
        block = undefined;
      } else if (prefix === ' ') {
        next += 1;
        block = undefined;
      } else if (prefix === '-') {
        if (block === undefined) {
          block = { at: next - 1, count: 0 };
          removed.push(block);
        }
        block.count += 1;
      }
    }
  }
  return { added, removed };
}