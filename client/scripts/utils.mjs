import fs from "fs/promises";
import path from "path";

/** Repository root directory path */
export const REPO_ROOT_PATH = path.join(process.argv[1], "..", "..", "..");

/** Supported program crates path */
export const SUPPORTED_CRATES_PATH = path.join(
  REPO_ROOT_PATH,
  "supported-crates.json"
);

/** Playground client directory path */
export const CLIENT_PATH = path.join(REPO_ROOT_PATH, "client");

/**
 * Remove the contents of the given directory.
 *
 * @param {string} dirPath directory path
 */
export const resetDir = async (dirPath) => {
  const dirExists = await exists(dirPath);
  if (dirExists) await fs.rm(dirPath, { recursive: true });
  await fs.mkdir(dirPath);
};

/**
 * Get whether the given path exists.
 *
 * @param {string} path item path
 * @returns whether the path exists
 */
export const exists = async (path) => {
  return !!(await fs.stat(path).catch(() => false));
};

/**
 * Read file and parse it as JSON.
 *
 * @param {string} filePath file path
 * @returns the parsed JSON
 */
export const readJSON = async (filePath) => {
  return JSON.parse(await fs.readFile(filePath));
};

/**
 * Recursively get all file paths under the given directory.
 *
 * @param {string} dirPath directory to start from
 * @param {string | undefined} initialDirPath initial directory; omit it
 * @returns {Promise<string[]>} the file paths
 */
export const findFilePaths = async (dirPath, initialDirPath = dirPath) => {
  const files = [];
  const dir = await fs.readdir(dirPath);
  for (const name of dir) {
    const itemPath = path.join(dirPath, name);
    const stat = await fs.lstat(itemPath);
    if (stat.isFile()) {
      files.push(itemPath.replace(initialDirPath + path.sep, ""));
    } else if (stat.isDirectory()) {
      files.push(...(await findFilePaths(itemPath, initialDirPath)));
    }
  }

  return files;
};

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
