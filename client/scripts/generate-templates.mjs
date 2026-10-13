// Generate project templates.

import fs from "fs/promises";
import path from "path";

import { REPO_ROOT_PATH, exists, findFilePaths } from "./utils.mjs";

const SERVER_TEMPLATES_PATH = path.join(REPO_ROOT_PATH, "server", "templates");
const CLIENT_TEMPLATES_PATH = path.join(
  REPO_ROOT_PATH,
  "client",
  "public",
  "templates"
);

// Remove the existing client dir
const templatesDirExists = await exists(CLIENT_TEMPLATES_PATH);
if (templatesDirExists) {
  await fs.rm(CLIENT_TEMPLATES_PATH, { recursive: true, force: true });
}

// Copy the server templates directly
await fs.cp(SERVER_TEMPLATES_PATH, CLIENT_TEMPLATES_PATH, { recursive: true });

const templates = await fs.readdir(CLIENT_TEMPLATES_PATH);
for (const template of templates) {
  const templatePath = path.join(CLIENT_TEMPLATES_PATH, template);
  const paths = await findFilePaths(templatePath);
  await fs.writeFile(
    path.join(templatePath, "paths.json"),
    JSON.stringify(paths)
  );
}

// Save all template names to a separate file so that client can know which
// templates exist without a separate route for them
await fs.writeFile(
  path.join(CLIENT_TEMPLATES_PATH, "names.json"),
  JSON.stringify(templates.sort())
);
