import * as vscode from "vscode";
import * as path from "path";
import { spawnSync } from "child_process";

import {
  Files,
  PackageMananger,
  PgCommon,
  PgFs,
  PgTerminal,
} from "../../utils";
import { GITHUB_URL, PATHS } from "../../constants";

interface CreateProps {
  name: string;
  files: Files;
}

export const CARGO_TOML_DEPENDENCIES_INFO = [
  "# NOTE: Dependencies will be ignored if you build with Solana Playground.",
  "# They can help you get Intellisense in VSCode. You can use them if you have",
  "# build tools installed locally.",
  `# See supported dependencies on ${GITHUB_URL}`,
].join("\n");

export const getProjectName = async () => {
  return (
    (await vscode.window.showInputBox({ placeHolder: "project name" })) ||
    "my-project"
  );
};

export const processCreate = async ({ name, files }: CreateProps) => {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Creating ${name}...`,
    },
    async () => {
      let createdNewFolder = false;

      const baseUri = await PgFs.getBaseUri();
      const baseDir = await vscode.workspace.fs.readDirectory(baseUri);
      if (baseDir.length) {
        const programsExists = baseDir.some(
          (d) => d[0] === PATHS.DIRS.PROGRAMS
        );
        if (programsExists) {
          // Check inside the directory
          const programsUri = vscode.Uri.joinPath(baseUri, PATHS.DIRS.PROGRAMS);
          const programsDir = await vscode.workspace.fs.readDirectory(
            programsUri
          );
          if (programsDir.length) {
            throw new Error(
              "Programs directory already exists and is not empty."
            );
          }
        }

        // Create files with the name prefix to not override current files
        files = files.map((f) => [path.join(name, f[0]), f[1]]);
        createdNewFolder = true;
      }

      await PgFs.writeFiles(files, baseUri);

      return { createdNewFolder };
    }
  );
};

export const processInstallNodeModules = async ({
  name,
  createdNewFolder,
}: Awaited<ReturnType<typeof processCreate>> & Pick<CreateProps, "name">) => {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Installing dependencies...",
    },
    async () => {
      // Sleep to fix vscode progress bar not gettin updated
      await PgCommon.sleep(100);

      // Get cwd
      const baseUri = await PgFs.getBaseUri();
      const cwd = createdNewFolder
        ? path.join(baseUri.fsPath, name)
        : baseUri.fsPath;

      const packageManager = PgTerminal.getPackageManager();
      switch (packageManager) {
        case PackageMananger.NPM:
          spawnSync(`npm i`, { cwd });
          break;
        case PackageMananger.YARN:
          spawnSync("yarn", { cwd });
          break;
        default:
          return;
      }
    }
  );
};
