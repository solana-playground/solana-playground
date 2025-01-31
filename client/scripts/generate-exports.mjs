// Generate file exports

import fs from "fs/promises";
import pathModule from "path";

import { CLIENT_PATH } from "./utils.mjs";

const DIRS = [
  "block-explorers",
  "commands",
  "frameworks",
  "languages",
  "routes",
  "themes",
];

for (const dir of DIRS) {
  const dirPath = pathModule.join(CLIENT_PATH, "src", dir);
  const items = await fs
    .readdir(dirPath)
    .then((items) => items.map(pathModule.parse));
  const namesToSkip = [dir, "index"];
  const hasDir = items.some((item) => !item.ext);
  const exports = items
    .filter(
      (item) => !namesToSkip.includes(item.name) && (hasDir ? !item.ext : true)
    )
    .map((item) => item.name)
    .reduce((acc, cur) => acc + `export * from "./${cur}";\n`, "");

  await fs.writeFile(pathModule.join(dirPath, `${dir}.ts`), exports);
}
