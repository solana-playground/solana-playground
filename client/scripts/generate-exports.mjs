// Generate file exports

import fs from "fs/promises";
import pathModule from "path";

import { CLIENT_PATH } from "./utils.mjs";

const srcPath = pathModule.join(CLIENT_PATH, "src");
for (const name of await fs.readdir(srcPath)) {
  const itemPath = pathModule.join(srcPath, name);
  const stat = await fs.stat(itemPath);
  if (!stat.isDirectory()) continue;

  const dirContent = await fs.readdir(itemPath);
  const isExportable = dirContent.includes(`${name}.ts`);
  if (!isExportable) continue;

  const items = await fs
    .readdir(itemPath)
    .then((items) => items.map(pathModule.parse));
  const namesToSkip = [name, "index", "__template"];
  const hasDir = items.some((item) => !item.ext);
  const exports = items
    .filter(
      (item) => !namesToSkip.includes(item.name) && (hasDir ? !item.ext : true)
    )
    .map((item) => item.name)
    .reduce((acc, cur) => acc + `export * from "./${cur}";\n`, "");

  await fs.writeFile(pathModule.join(itemPath, `${name}.ts`), exports);
}
