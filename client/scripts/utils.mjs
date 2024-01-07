import fs from "fs/promises";
import path from "path";

/** Repository root directory path */
export const REPO_ROOT_PATH = path.join(process.argv[1], "..", "..", "..");

/** Supported program crates path */
export const SUPPORTED_CRATES_PATH = path.join(
  REPO_ROOT_PATH,
  "supported-crates.json"
);

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

/** Utility class to handle markdown table related operations */
export class MarkdownTable {
  /** Markdown rows stored as array of arrays */
  #rows;

  /**
   * Create a markdown table.
   *
   * @param {string[]} rows
   */
  constructor(...rows) {
    this.#rows = [rows];
    this.insert("-", "-", "-");
  }

  /**
   * Insert a new row to the markdown table.
   *
   * @param {string[]} args
   */
  insert(...args) {
    this.#rows.push(args);
  }

  /** Convert the stored rows to a markdown table. */
  toString() {
    return this.#rows.reduce(
      (acc, row) =>
        acc + row.reduce((acc, cur) => `${acc} ${cur} |`, "|") + "\n",
      ""
    );
  }
}
