import { PgCommand } from "./commands";

/**
 * Keeps track of shell history
 */
export default class ShellHistory {
  private _cursor: number;
  private _size: number;
  private _entries: string[];

  constructor(size: number) {
    this._cursor = 0;
    this._size = size;
    this._entries = [];
  }

  getEntries() {
    return this._entries;
  }

  /**
   * Push an entry and maintain ring buffer size
   */
  push(entry: string) {
    // Skip empty entries or special last cmd
    if (!entry || entry === PgCommand.RUN_LAST_CMD) return;

    // If it's a duplicate entry, change index
    const entryIndex = this._entries.indexOf(entry);
    if (entryIndex !== -1) {
      const isEntryLastIndex = entryIndex === this._entries.length - 1;
      this._entries = this._entries
        .slice(0, entryIndex)
        .concat(
          this._entries.slice(isEntryLastIndex ? entryIndex : entryIndex + 1)
        );
    }

    // Only push if the last entry is not the same
    if (
      !this._entries.length ||
      this._entries[this._entries.length - 1] !== entry
    )
      this._entries.push(entry);

    // Keep track of entries
    if (this._entries.length > this._size) {
      this._entries = this._entries.slice(1);
    }
    this._cursor = this._entries.length;
  }

  /**
   * Sets the cursor to the previous entry if it exists
   *
   * @returns the previous entry if it exists
   */
  getPrevious() {
    const idx = Math.max(0, this._cursor - 1);
    this._cursor = idx;
    if (this._entries.length > idx) return this._entries[idx];
  }

  /**
   * Sets the cursor to the next entry if it exists
   *
   * @returns the next entry if it exists
   */
  getNext() {
    const idx = Math.min(this._entries.length, this._cursor + 1);
    this._cursor = idx;
    if (this._entries.length >= idx) return this._entries[idx];
  }
}
