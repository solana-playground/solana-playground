import { PgExplorer } from "../explorer";
import type { ValueOf } from "../types";

/** A map of string to unknown data as used for tutorial storage data */
type Data = Record<string, unknown>;

/**
 * Get the current tutorial's storage object that is useful for persisting user
 * data in the current tutorial.
 *
 * The API is rougly the same as the `Storage` API, e.g. `localStorage`, main
 * differences being:
 * - Asynchronous API due to using `indexedDB` under the hood
 * - Optionally, the storage object can be made type-safe
 *
 * # Example
 *
 * ```ts
 * type StorageData {
 *   field: number;
 *   anotherField: string;
 * }
 *
 * const storage = getTutorialStorage<StorageData>();
 * const field = await storage.getItem("field"); // number | undefined
 * ```
 *
 * @returns the tutorial storage
 */
export const getTutorialStorage = <T extends Data = Data>() => {
  class PgTutorialStorage {
    /**
     * Get the item from the given key.
     *
     * @param key key of the item
     * @returns the value or `undefined` if key doesn't exist
     */
    async getItem(key: keyof T) {
      const data = await this._readFile();
      return data[key] as ValueOf<T> | undefined;
    }

    /**
     * Set the key-value pair.
     *
     * @param key key of the item
     * @param value value of the item
     */
    async setItem(key: keyof T, value: ValueOf<T>) {
      const data = await this._readFile();
      data[key] = value;
      await this._writeFile(data);
    }

    /**
     * Remove the key-value pair if it exists.
     *
     * @param key key of the item
     */
    async removeItem(key: keyof T) {
      const data = await this._readFile();
      delete data[key];
      await this._writeFile(data);
    }

    /** Clear all key-value pairs and reset to the default state. */
    async clear() {
      await this._writeFile(PgTutorialStorage._DEFAULT);
    }

    /**
     * Read the tutorial storage data file as JSON.
     *
     * @returns the data as JSON
     */
    private async _readFile() {
      return await PgExplorer.fs.readToJSONOrDefault<T>(
        PgTutorialStorage._PATH,
        PgTutorialStorage._DEFAULT
      );
    }

    /**
     * Save the file with the given storage data.
     *
     * @param data storage data
     */
    private async _writeFile(data: T) {
      await PgExplorer.fs.writeFile(
        PgTutorialStorage._PATH,
        JSON.stringify(data)
      );
    }

    /** Relative path to the tutorial storage JSON file */
    private static _PATH = ".workspace/tutorial-storage.json";

    /** Default state of the tutorial storage data */
    private static _DEFAULT = {} as T;
  }

  return new PgTutorialStorage();
};
