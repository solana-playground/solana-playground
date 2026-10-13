// Generate tutorial data.

import fs from "fs/promises";
import path from "path";

import { CLIENT_PATH, findFilePaths } from "./utils.mjs";

/** Tutorials public directory path */
const TUTORIALS_PATH = path.join(CLIENT_PATH, "public", "tutorials");

const tutorials = await fs.readdir(TUTORIALS_PATH);
for (const tutorial of tutorials) {
  const tutorialPath = path.join(TUTORIALS_PATH, tutorial);
  const dir = await fs.readdir(tutorialPath);
  const isMarkdownTutorial = dir.includes("data.json");
  if (!isMarkdownTutorial) continue;

  const filesDirPath = path.join(tutorialPath, "files");
  const files = await findFilePaths(filesDirPath);
  await fs.writeFile(
    path.join(tutorialPath, "content.json"),
    JSON.stringify({ files })
  );
}
