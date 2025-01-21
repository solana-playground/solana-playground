import fs from "fs/promises";
import pathModule from "path";

import { CLIENT_PATH } from "./utils.mjs";

const dir = "block-explorers";
const fileName = `${dir}.ts`;
const dirPath = pathModule.join(CLIENT_PATH, "src", dir);
const items = await fs.readdir(dirPath);
const exports = items
  .filter((item) => item !== fileName && item !== "index.ts")
  .map(pathModule.parse)
  .map((parsed) => parsed.name)
  .reduce((acc, cur) => acc + `export * from "./${cur}";\n`, "");

await fs.writeFile(pathModule.join(dirPath, fileName), exports);
