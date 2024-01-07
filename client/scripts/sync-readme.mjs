// Sync root `README.md`.

import path from "path";
import fs from "fs/promises";
import { spawnSync } from "child_process";

import {
  MarkdownTable,
  readJSON,
  REPO_ROOT_PATH,
  SUPPORTED_CRATES_PATH,
} from "./utils.mjs";

/** Root README file path */
const README_PATH = path.join(REPO_ROOT_PATH, "README.md");
const readme = await fs.readFile(README_PATH, "utf8");

const supportedCratesTable = await createSupportedCratesTable();
const updatedReadme = replaceTable(
  readme,
  "Supported crates",
  supportedCratesTable
);

// Save README file
await fs.writeFile(README_PATH, updatedReadme);

// Format
spawnSync("yarn", ["run", "prettier", "--write", README_PATH]);

/**
 * Create supported crates Markdown table from the `SUPPORTED_CRATES_PATH`.
 *
 * @returns the supported crates table
 */
async function createSupportedCratesTable() {
  const table = new MarkdownTable("Crate", "Version");

  const crates = await readJSON(SUPPORTED_CRATES_PATH);
  const rows = Object.entries(crates).reduce((acc, [name, version]) => {
    acc.push([`[${name}](https://docs.rs/${name}/${version})`, version]);
    return acc;
  }, []);
  for (const row of rows) table.insert(...row);

  return table.toString();
}

/**
 * Get table start and finish indices of the given section.
 *
 * @param {string} content Markdown text
 * @param {string} section Markdown section name
 * @param {string} table Markdown table to set
 * @returns content with the new table
 */
function replaceTable(content, section, table) {
  const result = new RegExp(`(#)+\\s+${section}`).exec(content);
  if (!result) throw new Error(`Section "${section}" not found`);

  const sectionStartIndex = result.index;
  const startFromSectionContent = content.slice(sectionStartIndex);
  const tableFirstIndex = startFromSectionContent.indexOf("|");
  const tableLastIndex =
    tableFirstIndex +
    startFromSectionContent.slice(tableFirstIndex).indexOf("\n\n");

  return (
    content.slice(0, tableFirstIndex + sectionStartIndex) +
    table +
    content.slice(tableLastIndex + sectionStartIndex)
  );
}
