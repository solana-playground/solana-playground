import FS from "@isomorphic-git/lightning-fs";

import { PgCommon } from "../common";
import { PgExplorer } from "./explorer";

/** Async `indexedDB` based file system instance */
const fs = new FS("solana-playground").promises;

/**
 * Write a file.
 *
 * @param path file path
 * @param data file content
 * @param opts -
 * `createParents`: Whether to create the parent folders if they don't exist
 */
export const writeFile = async (
  path: string,
  data: string,
  opts?: { createParents?: boolean }
) => {
  path = PgExplorer.toAbsolutePath(path);

  if (opts?.createParents) {
    // TODO: Create a path module
    const parentFolder = PgExplorer.getParentPathFromPath(path);
    await createDir(parentFolder, opts);
  }

  await fs.writeFile(path, data);
};

/**
 * Read a file as string.
 *
 * @param path file path
 * @returns the content of the file
 */
export const readToString = async (path: string) => {
  path = PgExplorer.toAbsolutePath(path);
  return (await fs.readFile(path, { encoding: "utf8" })) as string;
};

/**
 * Read a file and parse it to JSON.
 *
 * @param path file path
 * @returns JSON parsed result
 */
export const readToJson = async <T>(path: string): Promise<T> => {
  const data = await readToString(path);
  return JSON.parse(data);
};

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
export const readToJsonOrDefault = async <T>(path: string, defaultValue: T) => {
  try {
    return await readToJson<T>(path);
  } catch {
    return defaultValue;
  }
};

/**
 * Rename an item(file or folder).
 *
 * @param oldPath old item path
 * @param newPath new item path
 */
export const rename = async (oldPath: string, newPath: string) => {
  oldPath = PgExplorer.toAbsolutePath(oldPath);
  newPath = PgExplorer.toAbsolutePath(newPath);
  await fs.rename(oldPath, newPath);
};

/**
 * Remove a file.
 *
 * @param path file path
 */
export const removeFile = async (path: string) => {
  path = PgExplorer.toAbsolutePath(path);
  await fs.unlink(path);
};

/**
 * Create a new directory.
 *
 * @param path directory path
 * @param opts -
 * `createParents`: Whether to create the parent folders if they don't exist
 */
export const createDir = async (
  path: string,
  opts?: { createParents?: boolean }
) => {
  path = PgExplorer.toAbsolutePath(path);

  if (opts?.createParents) {
    const folders = path.split("/");
    let currentPath = "";
    for (let i = 1; i < folders.length - 1; i++) {
      currentPath += "/" + folders[i];

      // Only create if the dir doesn't exist
      if (!(await exists(currentPath))) await fs.mkdir(currentPath);
    }
  } else {
    await fs.mkdir(path);
  }
};

/**
 * Read a directory.
 *
 * @param path directory path
 * @returns an array of the item names
 */
export const readDir = async (path: string) => {
  path = PgExplorer.toAbsolutePath(path);
  return await fs.readdir(path);
};

/**
 * Remove a directory.
 *
 * @param path directory path
 * @param opts -
 * `recursive`: Whether the recursively remove all of the child items
 */
export const removeDir = async (
  path: string,
  opts?: { recursive?: boolean }
) => {
  path = PgExplorer.toAbsolutePath(path);

  if (opts?.recursive) {
    const recursivelyRmdir = async (dir: string[], currentPath: string) => {
      if (!dir.length) {
        // Delete if it's an empty directory
        await fs.rmdir(currentPath);
        return;
      }

      for (const childName of dir) {
        const childPath = PgCommon.joinPaths(currentPath, childName);
        const metadata = await getMetadata(childPath);
        if (metadata.isDirectory()) {
          const childDir = await readDir(childPath);
          if (childDir.length) {
            await recursivelyRmdir(childDir, childPath);
          } else await fs.rmdir(childPath);
        } else {
          await removeFile(childPath);
        }
      }

      // Read the directory again and delete if it's empty
      const _dir = await readDir(currentPath);
      if (!_dir.length) await fs.rmdir(currentPath);
    };

    const dir = await readDir(path);
    await recursivelyRmdir(dir, path);
  } else {
    await fs.rmdir(path);
  }
};

/**
 * Get the metadata of a file.
 *
 * @param path item path
 * @returns the metadata of the file
 */
export const getMetadata = async (path: string) => {
  path = PgExplorer.toAbsolutePath(path);
  return await fs.stat(path);
};

/**
 * Get whether the given file exists in the file system.
 *
 * @param path item path
 * @returns whether the given file exists
 */
export const exists = async (path: string) => {
  path = PgExplorer.toAbsolutePath(path);

  try {
    await getMetadata(path);
    return true;
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") return false;

    console.log("Unknown error in `fs.exists`: ", e);
    throw e;
  }
};
