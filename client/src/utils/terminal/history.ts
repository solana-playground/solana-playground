/** Manage terminal history */
export class PgHistory {
  /** Maximum allowed size */
  private _size: number;
  /** Cursor index */
  private _cursor = 0;
  /** All history entries */
  private _entries: string[] = [];

  constructor(size: number) {
    this._size = size;
  }

  /** Get all entries. */
  getEntries() {
    return this._entries;
  }

  /** Push an entry while maintaining the `size` limit. */
  push(entry: string) {
    // Skip empty entries or special last cmd
    if (!entry || entry === "!!") return;

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
    ) {
      this._entries.push(entry);
    }

    // Keep track of entries
    if (this._entries.length > this._size) {
      this._entries = this._entries.slice(1);
    }

    this._cursor = this._entries.length;
  }

  /**
   * Set the cursor to the previous entry if it exists.
   *
   * @returns the previous entry if it exists
   */
  getPrevious() {
    const index = Math.max(0, this._cursor - 1);
    this._cursor = index;
    if (this._entries.length > index) return this._entries[index];
  }

  /**
   * Set the cursor to the next entry if it exists.
   *
   * @returns the next entry if it exists
   */
  getNext() {
    const index = Math.min(this._entries.length, this._cursor + 1);
    this._cursor = index;
    if (this._entries.length >= index) return this._entries[index];
  }
}
