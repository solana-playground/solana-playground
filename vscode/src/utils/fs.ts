import * as vscode from "vscode";
import * as path from "path";
import * as TOML from "@iarna/toml";

import { PATHS } from "../constants";
import { PgCommon } from "./common";

/** Array of [path, content] */
export type Files = [string, string][];

/** Solana program frameworks */
export enum Framework {
  NATIVE = 0,
  ANCHOR = 1,
  SEAHORSE = 2,
}

interface SelectedProgram {
  name: string;
  uri: vscode.Uri;
}

export class PgFs {
  static async readFile(uri: vscode.Uri) {
    const contentBytes = await vscode.workspace.fs.readFile(uri);
    return PgCommon.decodeBytes(contentBytes);
  }

  static async writeFile(uri: vscode.Uri, content: string) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
  }

  static async exists(uri: vscode.Uri) {
    try {
      await this.readFile(uri);
      return true;
    } catch {
      return false;
    }
  }

  static async writeFiles(files: Files, baseUri: vscode.Uri) {
    for (const file of files) {
      const path = file[0];
      const content = file[1];
      const uri = vscode.Uri.joinPath(baseUri, path);

      if (path.includes(".")) {
        // File
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
      } else {
        // Folder
        await vscode.workspace.fs.createDirectory(uri);
      }
    }
  }

  static async getBaseUri() {
    let baseUri = vscode.workspace.workspaceFolders?.[0].uri;

    if (!baseUri) {
      const newWorkspaceUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
      });
      if (!newWorkspaceUri) {
        throw new Error("Please select workspace location");
      }
      vscode.workspace.updateWorkspaceFolders(0, null, {
        uri: newWorkspaceUri[0],
      });

      baseUri = newWorkspaceUri[0];
    }

    return baseUri;
  }

  // vscode.workspace.findFiles()
  static async findFiles(
    regexp: RegExp,
    exclude: RegExp[] | null = this._EXCLUDE_REGEX
  ) {
    const uris: vscode.Uri[] = [];

    const recursivelyFind = async (baseUri: vscode.Uri) => {
      const baseDir = await vscode.workspace.fs.readDirectory(baseUri);
      for (const dirItem of baseDir) {
        const name = dirItem[0];
        if (exclude) {
          let skip;
          for (const excludeRegexp of exclude) {
            if (excludeRegexp.test(name)) skip = true;
          }
          if (skip) continue;
        }

        const uri = vscode.Uri.joinPath(baseUri, name);
        if (regexp.test(uri.fsPath)) {
          uris.push(uri);
        }

        if (dirItem[1] === vscode.FileType.Directory) {
          await recursivelyFind(uri);
        }
      }
    };

    const baseUri = await this.getBaseUri();
    await recursivelyFind(baseUri);

    return uris;
  }

  static async getFiles(...args: Parameters<typeof this.findFiles>) {
    const files: Files = [];

    const fileUris = await this.findFiles(...args);
    for (const fileUri of fileUris) {
      const contentBytes = await vscode.workspace.fs.readFile(fileUri);
      files.push([fileUri.toString(), PgCommon.decodeBytes(contentBytes)]);
    }

    return files;
  }

  static async getWorkspaceData() {
    const workspaceRootUris: {
      native: vscode.Uri[];
      anchor: vscode.Uri[];
      seahorse: vscode.Uri[];
    } = {
      native: [],
      anchor: [],
      seahorse: [],
    };

    const getFrameworks = async (uri: vscode.Uri) => {
      // Check whether to search inside the uri
      for (const excludeRegexp of this._EXCLUDE_REGEX) {
        if (excludeRegexp.test(uri.fsPath)) return;
      }

      // Get files of the directory
      const dirFiles = await vscode.workspace.fs.readDirectory(uri);

      // Get Cargo.toml
      const cargoToml = dirFiles.find((file) =>
        file[0].endsWith(PATHS.FILES.CARGO_TOML)
      );
      if (!cargoToml) {
        // Get sub directories
        const subDirs = dirFiles.filter(
          (file) => file[1] === vscode.FileType.Directory
        );
        for (const subDir of subDirs) {
          await getFrameworks(
            vscode.Uri.parse(path.join(uri.fsPath, subDir[0]))
          );
        }

        return;
      }

      // Directory has Cargo.toml, check for Anchor.toml
      const anchorToml = dirFiles.find(
        (file) =>
          file[1] === vscode.FileType.File &&
          file[0].endsWith(PATHS.FILES.ANCHOR_TOML)
      );
      if (!anchorToml) {
        // Must be Native
        workspaceRootUris.native.push(uri);
        return;
      }

      //  Directory has Anchor.toml, check for programs_py dir
      const programsPyDir = dirFiles.find(
        (file) =>
          file[1] === vscode.FileType.Directory &&
          file[0].endsWith(PATHS.DIRS.PROGRAMS_PY)
      );
      if (!programsPyDir) {
        // Must be Anchor
        workspaceRootUris.anchor.push(uri);
      } else {
        workspaceRootUris.seahorse.push(uri);
      }
    };

    const baseUri = await this.getBaseUri();
    await getFrameworks(baseUri);

    // Only Native
    if (
      workspaceRootUris.native.length === 1 &&
      !workspaceRootUris.anchor.length &&
      !workspaceRootUris.seahorse.length
    ) {
      return {
        framework: Framework.NATIVE,
        workspaceRootUri: workspaceRootUris.native[0],
      };
    }
    // Only Anchor
    if (
      !workspaceRootUris.native.length &&
      workspaceRootUris.anchor.length === 1 &&
      !workspaceRootUris.seahorse.length
    ) {
      return {
        framework: Framework.ANCHOR,
        workspaceRootUri: workspaceRootUris.anchor[0],
      };
    }
    // Only Seahorse
    if (
      !workspaceRootUris.native.length &&
      !workspaceRootUris.anchor.length &&
      workspaceRootUris.seahorse.length === 1
    ) {
      return {
        framework: Framework.SEAHORSE,
        workspaceRootUri: workspaceRootUris.seahorse[0],
      };
    }

    // Choose between multiple
    const { uri: programUri } = await this.selectProgram(baseUri);
    const cargoTomlUri = vscode.Uri.parse(
      path.join(programUri.fsPath, PATHS.FILES.CARGO_TOML)
    );
    if (await this.exists(cargoTomlUri)) {
      // Rust
      const cargoTomlStr = await this.readFile(cargoTomlUri);
      if (!cargoTomlStr.includes("anchor-lang")) {
        return {
          framework: Framework.NATIVE,
          workspaceRootUri: programUri,
        };
      }

      return {
        framework: Framework.ANCHOR,
        workspaceRootUri: vscode.Uri.parse(
          this._getItemPath(programUri, 2).path
        ),
      };
    } else if (workspaceRootUris.seahorse.length) {
      // Python
      return {
        framework: Framework.SEAHORSE,
        workspaceRootUri: vscode.Uri.parse(
          this._getItemPath(programUri, 2).path
        ),
      };
    }

    throw new Error("Make sure project is setup correctly.");
  }

  static async getProgramData() {
    let files: Files = [];
    let basePath;
    let programPath;
    let name;

    // Get framework
    const { framework, workspaceRootUri } = await this.getWorkspaceData();

    if (this.selectedProgram?.uri) {
      // Program path
      programPath = this.selectedProgram.uri.fsPath;

      switch (framework) {
        case Framework.NATIVE: {
          // Program Name
          const cargoTomlPath = path.join(programPath, PATHS.FILES.CARGO_TOML);
          const cargoTomlString = await this.readFile(
            vscode.Uri.parse(cargoTomlPath)
          );
          const cargoToml = TOML.parse(cargoTomlString) as {
            package: { name: string };
          };
          name = cargoToml.package.name;

          // Base Path
          basePath = this._getItemPath(cargoTomlPath, 1).path;

          files = await this.getFiles(
            new RegExp(`${programPath}${this._REGEX_PATH_SEP}.+\\.rs$`)
          );

          break;
        }
        case Framework.ANCHOR: {
          // Program Name
          const cargoTomlPath = path.join(programPath, PATHS.FILES.CARGO_TOML);
          const cargoTomlString = await this.readFile(
            vscode.Uri.parse(cargoTomlPath)
          );
          const cargoToml = TOML.parse(cargoTomlString) as {
            package: { name: string };
          };
          name = cargoToml.package.name;

          // Base Path
          basePath = this._getItemPath(cargoTomlPath, 3).path;

          files = await this.getFiles(
            new RegExp(`${programPath}${this._REGEX_PATH_SEP}.+\\.rs$`)
          );

          break;
        }
        case Framework.SEAHORSE: {
          name = this._getItemPath(programPath).name.replace(/\.py$/, "");
          basePath = this._getItemPath(programPath, 2).path;

          files = await this.getFiles(new RegExp(programPath));

          break;
        }
      }
    } else {
      switch (framework) {
        case Framework.NATIVE: {
          const rustRegex = /\.rs$/;

          // Find the program file(s)
          let programCount = 0;
          const uris = await this.findFiles(rustRegex);
          for (const uri of uris) {
            if (uri.toString().endsWith(PATHS.FILES.LIB_RS)) {
              programCount++;
            }
          }

          let cargoTomlUri;
          if (programCount > 1) {
            programPath = (await this.selectProgram()).uri.fsPath;
            cargoTomlUri = vscode.Uri.parse(
              path.join(programPath, PATHS.FILES.CARGO_TOML)
            );
            files = await this.getFiles(
              new RegExp(`${programPath}${this._REGEX_PATH_SEP}.+\\.rs$`)
            );
          } else {
            cargoTomlUri = (
              await this.findFiles(new RegExp(`${PATHS.FILES.CARGO_TOML}$`))
            )[0];
            programPath = this._getItemPath(cargoTomlUri, 1).path;
            files = await this.getFiles(rustRegex);
          }

          const libRsPath = files.find((f) =>
            f[0].endsWith(PATHS.FILES.LIB_RS)
          )![0];
          basePath = this._getItemPath(libRsPath, 2).path;

          const cargoTomlString = await this.readFile(cargoTomlUri);
          const cargoToml = TOML.parse(cargoTomlString) as {
            package: { name: string };
          };
          name = cargoToml.package.name;

          break;
        }

        case Framework.ANCHOR:
        case Framework.SEAHORSE: {
          // Check whether the workspace has one or multiple programs
          const isAnchor = framework === Framework.ANCHOR;
          const programsUri = vscode.Uri.joinPath(
            workspaceRootUri,
            isAnchor ? PATHS.DIRS.PROGRAMS : PATHS.DIRS.PROGRAMS_PY
          );
          let programsDirItems = await vscode.workspace.fs.readDirectory(
            programsUri
          );
          if (!isAnchor) {
            // Seahorse, exclude the seahorse directory
            programsDirItems = programsDirItems.filter(
              (item) => item[0] !== PATHS.DIRS.SEAHORSE
            );
          }
          if (programsDirItems.length === 1) {
            // There is one program, select it
            programPath = path.join(programsUri.fsPath, programsDirItems[0][0]);
          } else {
            // There are multiple programs, check whether current file exists
            let _programPath;

            const currentDocument = vscode.window.activeTextEditor?.document;
            if (currentDocument) {
              // Current file exists, check whether the current file belongs to program
              if (isAnchor && currentDocument.languageId === "rust") {
                _programPath = await this._recursivelyGetProgramPath(
                  currentDocument.uri
                );
              }
              // Seahorse, check whether current file is Python file and the
              // parent folder is programs_py
              else if (
                currentDocument.languageId === "python" &&
                this._getItemPath(currentDocument.fileName, 1).name ===
                  PATHS.DIRS.PROGRAMS_PY
              ) {
                _programPath = currentDocument.fileName;
              }
            }

            if (_programPath) {
              programPath = _programPath;
            } else {
              // Current file doesn't exist, let the user select it
              programPath = (await this.selectProgram(programsUri)).uri.fsPath;
            }
          }

          // Find the program file(s)
          files = await this.getFiles(
            new RegExp(
              isAnchor
                ? `${programPath}${this._REGEX_PATH_SEP}.+\\.rs$`
                : programPath
            )
          );

          // Get base path
          basePath = this._getItemPath(programsUri, 1).path;

          // Get program name
          if (isAnchor) {
            const cargoTomlPath = path.join(
              programPath,
              PATHS.FILES.CARGO_TOML
            );
            const cargoTomlString = await this.readFile(
              vscode.Uri.parse(cargoTomlPath)
            );
            const cargoToml = TOML.parse(cargoTomlString) as {
              package: { name: string };
            };
            name = cargoToml.package.name;
          } else {
            name = this._getItemPath(programPath).name.replace(/\.py$/, "");
          }

          break;
        }
      }
    }

    const afterSrcRegexRust = new RegExp(
      `${this._REGEX_PATH_SEP}${PATHS.DIRS.SRC}${this._REGEX_PATH_SEP}.+\\.rs$`
    );
    const afterSrcFiles: Files = [];
    for (const file of files) {
      if (file[0].endsWith(".py")) {
        afterSrcFiles.push([
          `/${PATHS.DIRS.SRC}/${this._getItemPath(file[0]).name}`,
          file[1],
        ]);
      } else {
        const afterSrc = afterSrcRegexRust.exec(file[0]);
        if (afterSrc) {
          // Playground path seperator is '/', replacing Windows path seperator
          afterSrcFiles.push([afterSrc[0].replace(path.sep, "/"), file[1]]);
        }
      }
    }

    return {
      files: afterSrcFiles,
      baseUri: vscode.Uri.parse(basePath),
      programUri: vscode.Uri.parse(programPath),
      programKpUri: vscode.Uri.parse(
        path.join(basePath, PATHS.DIRS.DEPLOY, `${name}-keypair.json`)
      ),
      framework,
      name,
    };
  }

  static selectedProgram: SelectedProgram | null;

  static async selectProgram(
    defaultUri?: vscode.Uri
  ): Promise<SelectedProgram> {
    if (this.selectedProgram) return this.selectedProgram;

    let programPath;

    // Get current document
    const currentDocument = vscode.window.activeTextEditor?.document;
    if (currentDocument?.languageId === "rust") {
      // If the current file is a Rust file and it belongs to a program, select it
      programPath = await this._recursivelyGetProgramPath(currentDocument.uri);
    } else if (currentDocument?.languageId === "python") {
      // If the current file is a Python file and it lives inside programs_py folder, select it
      if (
        this._getItemPath(currentDocument.uri, 1).name ===
        PATHS.DIRS.PROGRAMS_PY
      ) {
        programPath = currentDocument.fileName;
      }
    } else if (currentDocument?.languageId === "Log") {
      // Playground output channel is in focus, check whether other text editors
      // have Rust or Python documents open
      const rustOrPythonEditor = vscode.window.visibleTextEditors.find(
        (editor) =>
          editor.document.languageId === "rust" ||
          editor.document.languageId === "python"
      );
      if (rustOrPythonEditor) {
        // Make the document active
        await vscode.window.showTextDocument(rustOrPythonEditor.document);
        return await this.selectProgram(defaultUri);
      }
    }

    if (!programPath) {
      // Let the user choose the program
      const selectedProgramUris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        defaultUri,
        openLabel: "Select folder",
        title: "Select Program Folder",
      });
      if (!selectedProgramUris) throw new Error("Please select program folder");
      programPath = selectedProgramUris[0].fsPath;

      // Check whether the program path is programs_py folder
      if (this._getItemPath(programPath).name === PATHS.DIRS.PROGRAMS_PY) {
        // Check how many programs there are
        const pythonFiles = (
          await vscode.workspace.fs.readDirectory(vscode.Uri.parse(programPath))
        )
          .filter(
            (item) =>
              item[0] !== PATHS.DIRS.SEAHORSE &&
              item[1] === vscode.FileType.File &&
              item[0].endsWith(".py")
          )
          .map((item) => item[0]);

        // No program, throw error
        if (!pythonFiles.length) {
          throw new Error(
            "There are no python files in this directory. Please choose programs_py folder."
          );
        }
        // Single program, select it
        if (pythonFiles.length === 1) {
          programPath = path.join(programPath, pythonFiles[0]);
        }
        // Multiple programs, prompt the user to choose the program file
        else {
          const selectedProgramUris = await vscode.window.showOpenDialog({
            defaultUri: vscode.Uri.parse(programPath),
            openLabel: "Select file",
            title: "Select Seahorse Program",
          });
          if (!selectedProgramUris) {
            throw new Error("Please select Seahorse program file");
          }

          programPath = selectedProgramUris[0].fsPath;
        }
      }
    }

    this.selectedProgram = {
      name: this._getItemPath(programPath).name,
      uri: vscode.Uri.parse(programPath),
    };
    return this.selectedProgram;
  }

  static resetStatics() {
    console.log("Resetting fs statics");
    this.selectedProgram = null;
  }

  private static _REGEX_PATH_SEP =
    process.platform === "win32" ? `\\\\` : `\\/`;

  private static _EXCLUDE_REGEX = [
    /^\./,
    new RegExp(PATHS.DIRS.NODE_MODULES),
    new RegExp(PATHS.DIRS.TARGET),
    new RegExp(PATHS.DIRS.TESTS),
    new RegExp(PATHS.FILES.INIT_PY),
    new RegExp(PATHS.FILES.PRELUDE_PY),
  ];

  private static _getItemPath(p: string | vscode.Uri, n: number = 0) {
    if (typeof p !== "string") {
      p = p.fsPath;
    }
    const names = p.split(path.sep);
    return {
      name: names[names.length - (n + 1)],
      path: names.filter((_, i) => i <= names.length - (n + 1)).join(path.sep),
    };
  }

  private static _recursivelyGetProgramPath = async (
    currentUri: vscode.Uri,
    maxDepth = 5
  ): Promise<string | undefined> => {
    if (maxDepth === 0) return;

    // Get until parent folder name is src
    if (this._getItemPath(currentUri, 1).name === PATHS.DIRS.SRC) {
      return this._getItemPath(currentUri, 2).path;
    } else {
      maxDepth--;
      return await this._recursivelyGetProgramPath(
        vscode.Uri.parse(this._getItemPath(currentUri, 1).path),
        maxDepth
      );
    }
  };
}
