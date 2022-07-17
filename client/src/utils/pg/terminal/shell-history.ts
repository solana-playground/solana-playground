/**
 * The shell history provides an ring-buffer
 */
export default class ShellHistory {
  size: number;
  entries: Array<string>;
  cursor: number;

  constructor(size: number) {
    this.size = size;
    this.entries = [];
    this.cursor = 0;
  }

  /**
   * Push an entry and maintain ring buffer size
   */
  push(entry: string) {
    // Skip empty entries
    if (!entry) return;

    // If it's a duplicate entry, change index
    const entryIndex = this.entries.indexOf(entry);
    if (entryIndex !== -1) {
      const isEntryLastIndex = entryIndex === this.entries.length - 1;
      this.entries = this.entries
        .slice(0, entryIndex)
        .concat(
          this.entries.slice(isEntryLastIndex ? entryIndex : entryIndex + 1)
        );
    }

    // Only push if the last entry is not the same
    if (!this.entries.length || this.entries[this.entries.length - 1] !== entry)
      this.entries.push(entry);

    // Keep track of entries
    if (this.entries.length > this.size) {
      this.entries = this.entries.slice(1);
    }
    this.cursor = this.entries.length;
  }

  /**
   * Check if the history includes an entry
   */
  includes(entry: string) {
    return this.entries.includes(entry);
  }

  /**
   * Rewind history cursor on the last entry
   */
  rewind() {
    this.cursor = this.entries.length;
  }

  /**
   * Returns the previous entry
   */
  getPrevious() {
    const idx = Math.max(0, this.cursor - 1);
    this.cursor = idx;
    return this.entries[idx];
  }

  /**
   * Returns the next entry
   */
  getNext() {
    const idx = Math.min(this.entries.length, this.cursor + 1);
    this.cursor = idx;
    return this.entries[idx];
  }
}
