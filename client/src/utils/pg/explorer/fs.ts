import FS from "@isomorphic-git/lightning-fs";

import { PgExplorer } from "./explorer";

export class PgFs {
  /** Async `indexedDB` based file system instance */
  private static _fs = new FS("solana-playground").promises;

  /**
   * Write a file.
   *
   * @param path file path
   * @param data file content
   * @param opts -
   * `createParents`: Whether to create the parent folders if they don't exist
   */
  static async writeFile(
    path: string,
    data: string,
    opts?: { createParents?: boolean }
  ) {
    path = PgExplorer.convertToFullPath(path);

    if (opts?.createParents) {
      // TODO: Create a path module
      const parentFolder = PgExplorer.getParentPathFromPath(path);
      await this.createDir(parentFolder, opts);
    }

    await this._fs.writeFile(path, data);
  }

  /**
   * Read a file as string.
   *
   * @param path file path
   * @returns the content of the file
   */
  static async readToString(path: string) {
    path = PgExplorer.convertToFullPath(path);
    return (await this._fs.readFile(path, { encoding: "utf8" })) as string;
  }

  /**
   * Read a file and parse it to JSON.
   *
   * @param path file path
   * @returns JSON parsed result
   */
  static async readToJSON<T>(path: string): Promise<T> {
    const data = await this.readToString(path);
    return JSON.parse(data);
  }

  /**
   * Read a file and parse it to JSON.
   *
   * If there was an error while getting the JSON, the error will be caught and
   * the given `defaultValue` will be returned instead.
   *
   * @param path file path
   * @param defaultValue the default value to return if the file doesn't exist
   * @returns JSON parsed result or the given `defaultValue`
   */
  static async readToJSONOrDefault<T>(path: string, defaultValue: T) {
    try {
      return await this.readToJSON<T>(path);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Rename an item(file or folder).
   *
   * @param oldPath old item path
   * @param newPath new item path
   */
  static async rename(oldPath: string, newPath: string) {
    oldPath = PgExplorer.convertToFullPath(oldPath);
    newPath = PgExplorer.convertToFullPath(newPath);
    await this._fs.rename(oldPath, newPath);
  }

  /**
   * Remove a file.
   *
   * @param path file path
   */
  static async removeFile(path: string) {
    path = PgExplorer.convertToFullPath(path);
    await this._fs.unlink(path);
  }

  /**
   * Create a new directory.
   *
   * @param path directory path
   * @param opts -
   * `createParents`: Whether to create the parent folders if they don't exist
   */
  static async createDir(path: string, opts?: { createParents?: boolean }) {
    path = PgExplorer.convertToFullPath(path);

    if (opts?.createParents) {
      const folders = path.split("/");
      let currentPath = "";
      for (let i = 1; i < folders.length - 1; i++) {
        currentPath += "/" + folders[i];

        // Only create if the dir doesn't exist
        const exists = await this.exists(currentPath);
        if (!exists) await this._fs.mkdir(currentPath);
      }
    } else {
      await this._fs.mkdir(path);
    }
  }

  /**
   * Read a directory.
   *
   * @param path directory path
   * @returns an array of the item names
   */
  static async readDir(path: string) {
    path = PgExplorer.convertToFullPath(path);

    return await this._fs.readdir(path);
  }

  /**
   * Remove a directory.
   *
   * @param path directory path
   * @param opts -
   * `recursive`: Whether the recursively remove all of the child items
   */
  static async removeDir(path: string, opts?: { recursive?: boolean }) {
    path = PgExplorer.convertToFullPath(path);

    if (opts?.recursive) {
      const recursivelyRmdir = async (dir: string[], currentPath: string) => {
        if (!dir.length) {
          // Delete if it's an empty directory
          await this._fs.rmdir(currentPath);
          return;
        }

        for (const childName of dir) {
          const childPath = currentPath + childName;
          const metadata = await this.getMetadata(childPath);
          if (metadata.isDirectory()) {
            const childDir = await this.readDir(childPath);
            if (childDir.length) {
              await recursivelyRmdir(childDir, childPath + "/");
            } else await this._fs.rmdir(childPath);
          } else {
            await this.removeFile(childPath);
          }
        }

        // Read the directory again and delete if it's empty
        const _dir = await this.readDir(currentPath);
        if (!_dir.length) await this._fs.rmdir(currentPath);
      };

      const dir = await this.readDir(path);
      await recursivelyRmdir(dir, path);
    } else {
      await this._fs.rmdir(path);
    }
  }

  /**
   * Get the metadata of a file.
   *
   * @param path item path
   * @returns the metadata of the file
   */
  static async getMetadata(path: string) {
    path = PgExplorer.convertToFullPath(path);
    return await this._fs.stat(path);
  }

  /**
   * Get whether the given file exists in the file system.
   *
   * @param path item path
   * @returns whether the given file exists
   */
  static async exists(path: string) {
    path = PgExplorer.convertToFullPath(path);

    try {
      await this.getMetadata(path);
      return true;
    } catch (e: any) {
      if (e.code === "ENOENT" || e.code === "ENOTDIR") return false;
      else {
        console.log("Unknown error in exists: ", e);
        throw e;
      }
    }
  }
}
