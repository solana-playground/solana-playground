// Generate file exports

import fs from "fs/promises";
import pathModule from "path";

import { CLIENT_PATH } from "./utils.mjs";

/** Name of the generated file (without extension) */
const GENERATED_FILENAME = "generated";

const srcPath = pathModule.join(CLIENT_PATH, "src");
for (const name of await fs.readdir(srcPath)) {
  const itemPath = pathModule.join(srcPath, name);
  const stat = await fs.stat(itemPath);
  if (!stat.isDirectory()) continue;

  const items = await fs
    .readdir(itemPath)
    .then((items) => items.map(pathModule.parse));
  const isExportable = items.some((item) => item.name === name);
  if (!isExportable) continue;

  const namesToSkip = [GENERATED_FILENAME, name, "index", "__template"];
  const hasDir = items.some((item) => !item.ext);
  const exports = items
    .filter(
      (item) => !namesToSkip.includes(item.name) && (hasDir ? !item.ext : true)
    )
    .map((item) => item.name)
    .reduce((acc, cur) => acc + `export * from "./${cur}";\n`, "");

  await fs.writeFile(
    pathModule.join(itemPath, `${GENERATED_FILENAME}.ts`),
    exports
  );
}
