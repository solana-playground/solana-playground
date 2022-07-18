/**
 * Keeps track of shell history
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
    // Skip empty entries or special last cmd
    if (!entry || entry === "!!") return;

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
   * Rewind history cursor on the last entry
   */
  rewind() {
    this.cursor = this.entries.length;
  }

  /**
   * @returns the previous entry if it exists
   */
  getPrevious() {
    const idx = Math.max(0, this.cursor - 1);
    this.cursor = idx;
    if (this.entries.length > idx) return this.entries[idx];
  }

  /**
   * @returns the next entry if it exists
   */
  getNext() {
    const idx = Math.min(this.entries.length, this.cursor + 1);
    this.cursor = idx;
    if (this.entries.length >= idx) return this.entries[idx];
  }
}
