import fs from "fs/promises";
import path from "path";

/** Repository root directory path */
export const REPO_ROOT_PATH = path.join(process.argv[1], "..", "..", "..");

/**
 * Remove the contents of the given directory.
 *
 * @param {string} dirPath directory path
 */
export async function resetDir(dirPath) {
  const dirExists = await exists(dirPath);
  if (dirExists) await fs.rm(dirPath, { recursive: true });
  await fs.mkdir(dirPath);
}

/**
 * Get whether the given path exists.
 *
 * @param {string} path item path
 * @returns whether the path exists
 */
export async function exists(path) {
  return !!(await fs.stat(path).catch(() => false));
}

/**
 * Read file and parse it as JSON.
 *
 * @param {string} filePath file path
 * @returns the parsed JSON
 */
export async function readJSON(filePath) {
  return JSON.parse(await fs.readFile(filePath));
}
