// Generate tutorial data.

import fs from "fs/promises";
import pathModule from "path";

import { CLIENT_PATH } from "./utils.mjs";

/** Tutorials public directory path */
const TUTORIALS_PATH = pathModule.join(CLIENT_PATH, "public", "tutorials");

const tutorials = await fs.readdir(TUTORIALS_PATH);
for (const name of tutorials) {
  const tutorialPath = pathModule.join(TUTORIALS_PATH, name);
  const dir = await fs.readdir(tutorialPath);
  const isMarkdownTutorial = dir.includes("data.json");
  if (!isMarkdownTutorial) continue;

  // Get file paths
  const recursivelFindFiles = async (dirPath) => {
    const files = [];
    const dir = await fs.readdir(dirPath);
    for (const name of dir) {
      const path = pathModule.join(dirPath, name);
      const stat = await fs.lstat(path);
      if (stat.isFile()) {
        files.push(path.replace(filesDirPath + pathModule.sep, ""));
      } else if (stat.isDirectory()) {
        files.push(...(await recursivelFindFiles(path)));
      }
    }

    return files;
  };
  const filesDirPath = pathModule.join(tutorialPath, "files");
  const files = await recursivelFindFiles(filesDirPath);

  await fs.writeFile(
    pathModule.join(tutorialPath, "content.json"),
    JSON.stringify({ files })
  );
}
