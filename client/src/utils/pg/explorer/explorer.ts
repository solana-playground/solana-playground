import { Keypair } from "@solana/web3.js";

import { PgExplorerEvent } from "./events";
import { PgFs } from "./fs";
import { PgGithub } from "./github";
import { PgWorkspace } from "./workspace";
import { Lang } from "./frameworks";
import { PgCommon } from "../common";
import { PgProgramInfo } from "../program-info";
import { ClassName, Id, ItemError, WorkspaceError } from "../../../constants";
import type {
  ExplorerJSON,
  TupleFiles,
  Folder,
  FullFile,
  ItemMetaFile,
  ExplorerFiles,
} from "./types";

/**
 * Class that has both static and non-static methods for explorer.
 */
export class PgExplorer {
  /** Internal state */
  private static readonly _explorer: ExplorerJSON = { files: {} };
  /** Workspace functionality */
  private static _workspace: PgWorkspace | null = null;
  /** Whether the user is on a shared page */
  private static _shared: boolean;
  /** Current initialized workspace name */
  private static _initializedWorkspaceName: string | null = null;

  /** `indexedDB` file system */
  static fs = PgFs;

  /* ------------------------------- Getters ------------------------------- */

  /** Get whether the current page is shared */
  static get isShared() {
    return this._shared;
  }

  /** Get explorer files */
  static get files() {
    return this._explorer.files;
  }

  /**
   * Get full path of current workspace('/' appended)
   *
   * @throws if the workspace doesn't exist. Shouldn't be called on shared projects.
   */
  static get currentWorkspacePath() {
    if (!this.currentWorkspaceName) {
      throw new Error(WorkspaceError.CURRENT_NOT_FOUND);
    }

    return this._getWorkspacePath(this.currentWorkspaceName);
  }

  /** Get current workspace name */
  static get currentWorkspaceName() {
    return this._workspace?.currentName;
  }

  /** Get names of all workspaces */
  static get allWorkspaceNames() {
    return this._workspace?.allNames;
  }

  /* --------------------------- Public methods --------------------------- */

  /**
   * Initialize explorer.
   *
   * @param params -
   * - `files`: Initialize from the given explorer files
   * - `name`: Initialize the given workspace name
   */
  static async init(params?: { files?: ExplorerFiles; name?: string }) {
    if (
      this._initializedWorkspaceName ===
      (params?.name ?? this.currentWorkspaceName)
    ) {
      return;
    }

    if (params?.files) {
      this._shared = true;
      this._explorer.files = params.files;
      this._workspace = null;
    } else {
      this._shared = false;
      if (!this._workspace) {
        this._workspace = new PgWorkspace();
        await this._initWorkspaces();
      }

      const workspaceName = params?.name ?? this.currentWorkspaceName;

      // Check whether the workspace exists
      if (workspaceName && this.allWorkspaceNames!.includes(workspaceName)) {
        await this.switchWorkspace(workspaceName);
      }
    }
  }

  /**
   * If the project is not shared(default):
   * - Name and path checks
   * - Create new item in `indexedDB`
   * - If create is successful, also create the item in the state
   *
   * If the project is shared:
   * - Name and path checks
   * - Create item in the state
   */
  static async newItem(
    fullPath: string,
    content: string = "",
    opts?: {
      skipNameValidation?: boolean;
      override?: boolean;
      openOptions?: {
        dontOpen?: boolean;
        onlyRefreshIfAlreadyOpen?: boolean;
      };
    }
  ) {
    fullPath = this.convertToFullPath(fullPath);

    // Invalid name
    if (
      !opts?.skipNameValidation &&
      !PgExplorer.isItemNameValid(PgExplorer.getItemNameFromPath(fullPath))
    ) {
      throw new Error(ItemError.INVALID_NAME);
    }

    const files = this.files;

    // Check whether the item already exists
    if (files[fullPath] && !opts?.override) {
      throw new Error(ItemError.ALREADY_EXISTS);
    }

    const itemType = PgExplorer.getItemTypeFromPath(fullPath);

    // Ordering of `indexedDB` calls and state calls matter. If `indexedDB` call fails,
    // state will not change. Can't say the same if the ordering was in reverse.
    if (itemType.file) {
      if (!this.isShared) {
        await this.fs.writeFile(fullPath, content, { createParents: true });
      }

      files[fullPath] = {
        content,
        meta: files[fullPath]?.meta ?? {},
      };

      const isCurrentFile = this.getCurrentFile()?.path === fullPath;

      if (!opts?.openOptions || opts?.openOptions?.onlyRefreshIfAlreadyOpen) {
        // Close the file if we are overriding to correctly display the new content
        if (opts?.override && isCurrentFile) {
          this.closeTab(fullPath);
        }

        if (!opts?.openOptions || isCurrentFile) {
          this.changeCurrentFile(fullPath);
        } else {
          PgExplorerEvent.dispatchOnDidCreateItem();
        }
      }
    } else {
      // Folder
      if (!this.isShared) {
        await this.fs.createDir(fullPath);
      }

      files[fullPath] = {};

      PgExplorerEvent.dispatchOnDidCreateItem();
    }

    await this.saveMeta();
  }

  /**
   * If the project is not shared(default):
   * - Name and path checks
   * - Rename in `indexedDB`
   * - If rename is successful also rename item in the state
   *
   * If the project is shared:
   * - Name and path checks
   * - Rename in state
   */
  static async renameItem(
    fullPath: string,
    newName: string,
    opts?: { skipNameValidation?: boolean }
  ) {
    fullPath = this.convertToFullPath(fullPath);

    if (!opts?.skipNameValidation && !PgExplorer.isItemNameValid(newName)) {
      throw new Error(ItemError.INVALID_NAME);
    }
    if (fullPath === this.getCurrentSrcPath()) {
      throw new Error(ItemError.SRC_RENAME);
    }

    const itemType = PgExplorer.getItemTypeFromPath(fullPath);
    const newItemType = PgExplorer.getItemTypeFromName(newName);
    if (
      (itemType.file && !newItemType.file) ||
      (itemType.folder && !newItemType.folder)
    ) {
      throw new Error(ItemError.TYPE_MISMATCH);
    }

    const parentFolder = PgExplorer.getParentPathFromPath(fullPath);

    // Get new path
    let newPath;
    if (
      this._workspace?.allNames.includes(
        fullPath.substring(1, fullPath.length - 1)
      )
    ) {
      // Github workspace name or any other workspace name with additional '/'
      // is causing problems. We are mitigating that by directly replacing it.
      newPath = PgCommon.appendSlash(
        PgCommon.joinPaths([PgExplorer.PATHS.ROOT_DIR_PATH, newName])
      );
    } else {
      newPath = itemType.file
        ? parentFolder + newName
        : parentFolder + newName + "/";
    }

    // Check to see if newName already exists
    if (newPath === fullPath) return;

    const files = this.files;
    if (files[newPath]) throw new Error(ItemError.ALREADY_EXISTS);

    // Rename in `indexedDB`
    if (!this.isShared) {
      await this.fs.rename(fullPath, newPath);
    }

    if (itemType.file) {
      // Store the file
      const file = files[fullPath];

      // Delete the old path and data
      delete files[fullPath];

      // Set the new path
      files[newPath] = file;
    } else {
      // We need to loop through all files in order to change every child path
      for (const path in files) {
        // /programs/my_program/logs/logfile.log
        // If we are renaming 'my_program' then we can replace '/programs/my_program/'
        // with '/programs/<new_name>/'
        if (path.startsWith(fullPath)) {
          const namesArr = fullPath.split("/");
          const pathWithoutName = namesArr
            .filter((_itemName, i) => i !== namesArr.length - 2)
            .reduce((acc, itemName) => (acc += `/${itemName}`));

          // This is the folder path
          const newFolderPath = pathWithoutName + newName + "/";

          // This is the full path that could be a children(newFolderPath + ...)
          const newFullPath = path.replace(fullPath, newFolderPath);

          // Check if newPath exists
          if (files[newFullPath]) throw new Error(ItemError.ALREADY_EXISTS);

          // Store the data
          const data = files[path];

          // Delete the old path and data
          delete files[path];

          // Set the new path with the data
          files[newFullPath] = data;
        }
      }
    }

    PgExplorerEvent.dispatchOnDidSwitchFile(this.getCurrentFile()!);

    PgExplorerEvent.dispatchOnDidRenameItem();

    await this.saveMeta();
  }

  /**
   * If the project is not shared(default):
   * - Delete from `indexedDB`(recursively)
   * - If delete is successful, delete from state
   *
   * If the project is shared:
   * - Delete from state
   */
  static async deleteItem(fullPath: string) {
    fullPath = this.convertToFullPath(fullPath);

    // Can't delete src folder
    if (fullPath === this.getCurrentSrcPath()) {
      throw new Error(ItemError.SRC_DELETE);
    }

    if (!this.isShared) {
      const metadata = await this.fs.getMetadata(fullPath);
      if (metadata.isFile()) await this.fs.removeFile(fullPath);
      else await this.fs.removeDir(fullPath, { recursive: true });
    }

    const files = this.files;

    const isCurrentFile = files[fullPath]?.meta?.current;

    // If we are deleting current file's parent(s)
    // we need to update the current file to the last tab
    let isCurrentParent = false;
    if (this.getCurrentFile()?.path.startsWith(fullPath)) {
      isCurrentParent = true;
    }

    for (const path in files) {
      if (path.startsWith(fullPath)) {
        delete files[path];
      }
    }

    // Deleting all elements from a folder results with the parent folder
    // disappearing, add the folder back to mitigate that
    files[PgExplorer.getParentPathFromPath(fullPath)] = {};

    // Change current file to the last tab when current file is deleted
    // or current file's parent is deleted
    if (isCurrentFile || isCurrentParent) this._changeCurrentFileToTheLastTab();

    PgExplorerEvent.dispatchOnDidDeleteItem();

    await this.saveMeta();
  }

  /**
   * Create a new workspace and change the current workspace to the created workspace
   * @param name new workspace name
   * @param opts -
   * - files: TupleFiles to create the workspace from
   * - defaultOpenFile: Default file to open in the editor
   * - fromShared: Whether to create new workspace from a shared project
   */
  static async newWorkspace(
    name: string,
    opts?: {
      files?: TupleFiles;
      defaultOpenFile?: string;
      fromShared?: boolean;
    }
  ) {
    name = name.trim();
    if (!name) throw new Error(WorkspaceError.INVALID_NAME);

    if (opts?.fromShared && this.isShared) {
      // The reason we are not just getting the necessary files and re-calling this
      // function with { files } is because we would lose the tab info. Instead we
      // are creating a valid workspace state and writing it to `indexedDB`.

      this._shared = false;
      this._workspace = new PgWorkspace();

      // Init workspace
      await this._initWorkspaces();
      // Create a new workspace in state
      this._workspace.new(name);

      // Change state paths(shared projects start with /src)
      for (const path in this.files) {
        const data = this.files[path];
        delete this.files[path];
        this.files[`/${name}${path}`] = data;
      }

      // Save everything from state to `indexedDB`
      await this._writeAllFromState();

      // Save metadata
      await this.saveMeta({ initial: true });

      await this.switchWorkspace(name);

      return;
    }

    if (!this._workspace) throw new Error(WorkspaceError.NOT_FOUND);

    // Save metadata before initializing so data is never lost
    if (this.hasWorkspaces()) await this.saveMeta();

    // Create a new workspace in state
    this._workspace.new(name);

    // Create files
    if (opts?.files) {
      for (const pathContent of opts?.files) {
        const fullPath = this.currentWorkspacePath + pathContent[0];
        const content = pathContent[1];
        await this.fs.writeFile(fullPath, content, { createParents: true });
      }
    }

    PgExplorerEvent.dispatchOnDidCreateWorkspace();

    await this.switchWorkspace(name, {
      initial: true,
      defaultOpenFile: opts?.defaultOpenFile,
    });
  }

  /**
   * Change the current workspace to the given workspace
   * @param name workspace name to change to
   * @param opts -
   * - initial: if changing to the given workspace for the first time
   * - defaultOpenFile: the file to open in the editor
   */
  static async switchWorkspace(
    name: string,
    opts?: { initial?: boolean; defaultOpenFile?: string }
  ) {
    // Save metadata before changing the workspace to never lose data
    await this.saveMeta(opts);

    // Set the workspace
    this.setWorkspaceName(name);
    await this._saveWorkspaces();

    // Initialize the workspace
    await this._initCurrentWorkspace();

    // Open the default file if it has been specified
    if (opts?.defaultOpenFile) {
      this.changeCurrentFile(this.currentWorkspacePath + opts.defaultOpenFile);

      // Save metadata to never lose default open file
      await this.saveMeta();
    } else {
      PgExplorerEvent.dispatchOnDidSwitchFile(this.getCurrentFile()!);
    }

    // Set initialized workspace name
    this._initializedWorkspaceName = name;

    // Dispatch change event
    PgExplorerEvent.dispatchOnDidSwitchWorkspace();
  }

  /**
   * Rename the current workspace
   * @param newName new workspace name
   */
  static async renameWorkspace(newName: string) {
    newName = newName.trim();
    if (!newName) {
      throw new Error(WorkspaceError.INVALID_NAME);
    }
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }
    if (this.allWorkspaceNames?.includes(newName)) {
      throw new Error(WorkspaceError.ALREADY_EXISTS);
    }

    await this.renameItem(this.currentWorkspacePath, newName, {
      skipNameValidation: true,
    });

    // Rename workspace in state
    this._workspace.rename(newName);

    await this.switchWorkspace(newName);
  }

  /**
   * Delete the current workspace
   */
  static async deleteWorkspace() {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }
    if (!this.currentWorkspaceName) {
      throw new Error(WorkspaceError.CURRENT_NOT_FOUND);
    }

    // Delete from state
    this._workspace.delete(this.currentWorkspaceName);

    await this.deleteItem(this.currentWorkspacePath);

    const workspaceCount = this._workspace.allNames.length;
    if (workspaceCount) {
      const lastWorkspace = this._workspace.allNames[workspaceCount - 1];
      await this.switchWorkspace(lastWorkspace, { initial: true });
    } else {
      this._workspace.setCurrent({ allNames: [] });
      await this._saveWorkspaces();
      PgExplorerEvent.dispatchOnDidSwitchWorkspace();
    }

    PgExplorerEvent.dispatchOnDidDeleteWorkspace();
  }

  /**
   * Export the current workspace as a zip file
   */
  static async exportWorkspace() {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    const recursivelyGetItems = async (path: string) => {
      const itemNames = await this.fs.readDir(path);
      if (!itemNames.length) return;

      const subItemPaths = itemNames
        .filter((itemName) => !itemName.startsWith("."))
        .map((itemName) => PgCommon.appendSlash(path) + itemName);

      for (const subItemPath of subItemPaths) {
        const metadata = await this.fs.getMetadata(subItemPath);
        const relativePath = this.getRelativePath(subItemPath);
        if (metadata.isFile()) {
          const content = await this.fs.readToString(subItemPath);
          zip.file(relativePath, content);
        } else {
          zip.folder(relativePath);
          await recursivelyGetItems(subItemPath);
        }
      }
    };

    await recursivelyGetItems(this.currentWorkspacePath);

    const content = await zip.generateAsync({ type: "blob" });

    const { default: saveAs } = await import("file-saver");
    saveAs(content, this.currentWorkspaceName + ".zip");
  }

  /**
   * Create a new workspace from the url
   *
   * @param url Github url to a program's content(folder or single file)
   */
  static async importFromGithub(url: string) {
    // Get repository info
    const { files, owner, repo, path } = await PgGithub.getImportableRepository(
      url
    );

    // Check whether the repository already exists in user's workspaces
    const githubWorkspaceName = `github-${owner}/${repo}/${path}`;
    if (this._workspace?.allNames.includes(githubWorkspaceName)) {
      // Switch to the existing workspace
      await this.switchWorkspace(githubWorkspaceName);
    } else {
      // Get the default open file since there is no previous metadata saved
      let defaultOpenFile;
      const libRsFile = files.find((f) => f[0].endsWith("lib.rs"));
      if (libRsFile) {
        defaultOpenFile = libRsFile[0];
      } else if (files.length > 0) {
        defaultOpenFile = files[0][0];
      }

      // Create a new workspace
      await this.newWorkspace(githubWorkspaceName, {
        files,
        defaultOpenFile,
      });
    }
  }

  /**
   * Saves file metadata to `indexedDB`
   *
   * NOTE: Only runs when the project is not shared.
   */
  static async saveMeta(opts?: { initial?: boolean }) {
    if (
      this.isShared ||
      !this.currentWorkspaceName ||
      !Object.keys(this.files).length
    ) {
      return;
    }

    const metaFile: ItemMetaFile = {};
    if (!opts?.initial) {
      for (const path in this.files) {
        metaFile[this.getRelativePath(path)] = { ...this.files[path].meta };
      }
    }

    // Save file
    await this.fs.writeFile(
      PgWorkspace.METADATA_PATH,
      JSON.stringify(metaFile),
      { createParents: true }
    );
  }

  /* ---------------------------- State methods ---------------------------- */

  /**
   * Save the file to the state only.
   */
  static saveFileToState(path: string, content: string) {
    path = this.convertToFullPath(path);
    if (this.files[path]) this.files[path].content = content;
  }

  /**
   * @returns all the files from state that are in tabs
   */
  static getTabs() {
    const files = this.files;
    const tabs: FullFile[] = [];

    for (const path in files) {
      const meta = files[path].meta;

      if (meta?.tabs)
        tabs.push({
          path,
          meta: {
            current: meta.current,
            topLineNumber: meta.topLineNumber,
          },
        });
    }

    return tabs;
  }

  /**
   * Get the full file data.
   *
   * @param path path of the file, defaults to the current file if it exists.
   */
  static getFile(path: string): FullFile | null {
    path = this.convertToFullPath(path);
    const itemInfo = this.files[path];
    if (itemInfo) return { path, ...this.files[path] };
    return null;
  }

  /**
   * Get file content from the state
   *
   * @param path full path to the file
   * @returns the file content from the state
   */
  static getFileContent(path: string) {
    return this.getFile(path)?.content;
  }

  /**
   * Gets items inside the folder and groups them into `folders` and `files`
   */
  static getFolderContent(path: string) {
    const files = this.files;
    const filesAndFolders: Folder = { folders: [], files: [] };

    for (const itemPath in files) {
      if (itemPath.startsWith(path)) {
        const item = itemPath.split(path)[1].split("/")[0];
        if (
          !filesAndFolders.files.includes(item) &&
          !filesAndFolders.folders.includes(item) &&
          item
        ) {
          // It's a file if it contains '.'
          // TODO: Implement a better system for folders and files
          if (item.includes(".")) filesAndFolders.files.push(item);
          else filesAndFolders.folders.push(item);
        }
      }
    }

    return filesAndFolders;
  }

  /**
   * Gets the current opened file from state if it exists
   */
  static getCurrentFile() {
    const files = this.files;

    for (const path in files) {
      const fileInfo = files[path];

      if (fileInfo.meta?.current) {
        const currentFile: FullFile = { content: fileInfo.content, path };
        return currentFile;
      }
    }

    return null;
  }

  /**
   * Changes the current opened file in state if it exists
   */
  static changeCurrentFile(newPath: string) {
    newPath = this.convertToFullPath(newPath);

    const files = this.files;

    const curFile = this.getCurrentFile();
    if (curFile) {
      if (newPath === curFile.path) return;

      files[curFile.path].meta = {
        ...files[curFile.path].meta,
        current: false,
      };
    }

    // Add file to the tabs and current
    files[newPath].meta = {
      ...files[newPath].meta,
      tabs: true,
      current: true,
    };

    PgExplorerEvent.dispatchOnDidSwitchFile(this.getCurrentFile()!);
  }

  /**
   * Get the visible top line number in Editor from state
   *
   * @param path Full path to the file
   * @returns The top line number
   */
  static getEditorTopLineNumber(path: string) {
    return this.files[path].meta?.topLineNumber;
  }

  /**
   * Save the first visible top line number in editor to state
   *
   * @param path Full path to the file
   * @param topLineNumber Visible top line number
   */
  static saveEditorTopLineNumber(path: string, topLineNumber: number) {
    if (!this.files[path]) return;
    this.files[path].meta = { ...this.files[path].meta, topLineNumber };
  }

  /**
   * Closes the tab and changes the current file to the last opened tab if it exists
   */
  static closeTab(path: string) {
    path = this.convertToFullPath(path);

    const files = this.files;
    files[path].meta!.tabs = false;

    // If we are closing the current file, change current file to the last tab
    if (files[path].meta?.current) {
      files[path].meta!.current = false;
      this._changeCurrentFileToTheLastTab();
    }

    PgExplorerEvent.dispatchOnDidCloseTab();
  }

  /**
   * @param path path to be appended after the current workspace path
   * @returns full path based on the input
   */
  static appendToCurrentWorkspacePath(path: string) {
    return PgCommon.appendSlash(
      this.currentWorkspacePath + PgCommon.withoutPreSlash(path)
    );
  }

  /**
   * @returns the necessary data for the build request
   */
  static getBuildFiles() {
    let programPkStr = PgProgramInfo.getPkStr();
    if (!programPkStr) {
      const kp = Keypair.generate();
      PgProgramInfo.update({ kp });
      programPkStr = kp.publicKey.toBase58();
    }

    const updateIdRust = (content: string) => {
      let updated = false;

      const rustDeclareIdRegex = new RegExp(
        /^(([\w]+::)*)declare_id!\("(\w*)"\)/gm
      );
      const newContent = content.replace(rustDeclareIdRegex, (match) => {
        const res = rustDeclareIdRegex.exec(match);
        if (!res) return match;
        updated = true;

        // res[1] could be solana_program:: or undefined
        return (res[1] ?? "\n") + `declare_id!("${programPkStr}")`;
      });

      return {
        content: newContent,
        updated,
      };
    };

    const updateIdPython = (content: string) => {
      let updated = false;

      const pythonDeclareIdRegex = new RegExp(
        /^declare_id\(("|')(\w*)("|')\)/gm
      );

      const newContent = content.replace(pythonDeclareIdRegex, (match) => {
        const res = pythonDeclareIdRegex.exec(match);
        if (!res) return match;
        updated = true;
        return `declare_id('${programPkStr}')`;
      });

      return {
        content: newContent,
        updated,
      };
    };

    const getUpdatedProgramIdContent = (path: string) => {
      let content = files[path].content;
      let updated = false;
      if (content) {
        if (path.endsWith(".rs")) {
          const updateIdResult = updateIdRust(content);
          content = updateIdResult.content;
          updated = updateIdResult.updated;
        } else if (path.endsWith(".py")) {
          const updateIdResult = updateIdPython(content);
          content = updateIdResult.content;
          updated = updateIdResult.updated;
        }
      }

      return { content, updated };
    };

    // Prioritise files where we are likely to find a rust `declare_id!`
    const prioritiseFilePaths = (files: ExplorerFiles) => {
      const prioritised: Array<string> = [];
      for (const path in files) {
        if (path.endsWith("lib.rs") || path.endsWith("id.rs")) {
          prioritised.unshift(path);
        } else {
          prioritised.push(path);
        }
      }
      return prioritised;
    };

    const files = this.files;
    const prioritisedFilePaths = prioritiseFilePaths(files);
    const buildFiles: TupleFiles = [];

    if (this.isShared) {
      let alreadyUpdatedId = false;
      for (const path of prioritisedFilePaths) {
        let content;
        // Shared files are already in correct format, we only update program id
        if (!alreadyUpdatedId) {
          const updateIdResult = getUpdatedProgramIdContent(path);
          content = updateIdResult.content;
          alreadyUpdatedId = updateIdResult.updated;
        } else {
          content = files[path].content;
        }
        if (!content) continue;
        buildFiles.push([path, content]);
      }
    } else {
      let alreadyUpdatedId = false;
      for (let path of prioritisedFilePaths) {
        if (!path.startsWith(this.getCurrentSrcPath())) continue;

        let content = files[path].content;
        if (!alreadyUpdatedId) {
          const updateIdResult = getUpdatedProgramIdContent(path);
          content = updateIdResult.content;
          alreadyUpdatedId = updateIdResult.updated;
        }
        if (!content) continue;

        // We are removing the workspace from path because build only needs /src
        path = path.replace(
          this.currentWorkspacePath,
          PgExplorer.PATHS.ROOT_DIR_PATH
        );

        buildFiles.push([path, content]);
      }
    }

    return buildFiles;
  }

  /**
   * Get the current file's language from it's path
   *
   * @returns the current language name
   */
  static getCurrentFileLanguage() {
    const currentPath = this.getCurrentFile()?.path;
    if (!currentPath) return null;
    const path = this.isShared
      ? currentPath
      : this.getRelativePath(currentPath);
    return PgExplorer.getLanguageFromPath(path);
  }

  /**
   * @returns whether the current file in the state is a Typescript test file
   */
  static isCurrentFileJsLike() {
    switch (this.getCurrentFileLanguage()) {
      case Lang.JAVASCRIPT:
      case Lang.TYPESCRIPT:
      case Lang.JAVASCRIPT_TEST:
      case Lang.TYPESCRIPT_TEST:
        return true;
      default:
        return false;
    }
  }

  /**
   * @returns whether the current workspace in the state is an Anchor program
   */
  static isWorkspaceAnchor() {
    const libRsPath = this.getCurrentSrcPath() + "lib.rs";
    return this.files[libRsPath]?.content?.includes("anchor") ?? false;
  }

  /**
   * Set the current workspace name.
   *
   * @param name workspace name
   */
  static setWorkspaceName(name: string) {
    this._workspace!.setCurrentName(name);
  }

  /**
   * @returns whether the user has any workspaces
   */
  static hasWorkspaces() {
    return (this._workspace?.allNames?.length ?? 0) > 0;
  }

  /**
   * Get the path without the workspace path prefix.
   *
   * @param fullPath full path
   * @returns the relative path
   */
  static getRelativePath(fullPath: string) {
    if (this.isShared) {
      return fullPath;
    }

    const split = fullPath.split(this.currentWorkspacePath);
    if (split.length === 1) {
      return split[0];
    }

    return split[1];
  }

  // TODO: Path module
  /**
   * Convert the given path to a full path.
   *
   * @param path path to convert
   * @returns the full path
   */
  static convertToFullPath(path: string) {
    // Convert to absolute path if it doesn't start with '/'
    if (!path.startsWith(PgExplorer.PATHS.ROOT_DIR_PATH)) {
      path =
        (this.isShared
          ? PgExplorer.PATHS.ROOT_DIR_PATH
          : this.currentWorkspacePath) + path;
    }
    return path;
  }

  /**
   * @returns current src directory path
   */
  static getCurrentSrcPath() {
    const srcPath = this.isShared
      ? PgExplorer.PATHS.ROOT_DIR_PATH + PgExplorer.PATHS.SRC_DIRNAME
      : this.appendToCurrentWorkspacePath(PgExplorer.PATHS.SRC_DIRNAME);
    return PgCommon.appendSlash(srcPath);
  }

  /* --------------------------- Change listeners --------------------------- */

  /**
   * Runs after explorer state has changed and the UI needs to re-render.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onNeedRender(cb: () => unknown) {
    return PgCommon.batchChanges(cb, [
      PgExplorer.onDidSwitchFile,
      PgExplorer.onDidDeleteItem,
      PgExplorer.onDidCloseTab,
    ]);
  }

  /**
   * Runs after creating a new item.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidCreateItem(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_CREATE_ITEM,
    });
  }

  /**
   * Runs after renaming an item.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidRenameItem(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_RENAME_ITEM,
    });
  }

  /**
   * Runs after deleting an item.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidDeleteItem(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_DELETE_ITEM,
    });
  }

  /**
   * Runs after switching to a different file.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidSwitchFile(cb: (file: FullFile | null) => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_SWITCH_FILE,
      initialRun: { value: PgExplorer.getCurrentFile() },
    });
  }

  /**
   * Runs after closing a tab.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidCloseTab(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_CLOSE_TAB,
    });
  }

  /**
   * Runs after creating a workspace.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidCreateWorkspace(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_CREATE_WORKSPACE,
    });
  }

  /**
   * Runs after renaming a workspace.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidRenameWorkspace(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_RENAME_WORKSPACE,
    });
  }

  /**
   * Runs after deleting a workspace.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidDeleteWorkspace(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_DELETE_WORKSPACE,
    });
  }

  /**
   * Runs after switching to a different workspace.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidSwitchWorkspace(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_SWITCH_WORKSPACE,
    });
  }

  /* --------------------------- Private methods --------------------------- */

  /**
   * Initialize explorer with the current workspace.
   *
   * Only the current workspace at a time will be in the memory.
   */
  private static async _initCurrentWorkspace() {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    // Reset files
    this._explorer.files = {};

    // Sets up the files from `indexedDB` to the state
    const setupFiles = async (path: string) => {
      const itemNames = await this.fs.readDir(path);

      if (!itemNames.length) {
        // Empty directory
        this.files[path] = {};
        return;
      }

      const subItemPaths = itemNames.map(
        (itemName) =>
          PgCommon.appendSlash(path) +
          itemName +
          (PgExplorer.getItemTypeFromName(itemName).folder ? "/" : "")
      );
      for (const subItemPath of subItemPaths) {
        const metadata = await this.fs.getMetadata(subItemPath);
        if (metadata.isFile()) {
          try {
            // This might fail if the user closes the window when a file delete
            // operation has not been completed yet
            const content = await this.fs.readToString(subItemPath);
            this.files[subItemPath] = { content };
          } catch (e: any) {
            console.log(`Couldn't read to string: ${e.message} ${subItemPath}`);
          }
        } else {
          await setupFiles(subItemPath);
        }
      }
    };

    try {
      await setupFiles(this.currentWorkspacePath);
    } catch (e: any) {
      console.log("Couldn't setup files:", e.message);

      // This helps with in rare case where user logs out during rename
      if (this._workspace.allNames.length) {
        const rootDirs = await this.fs.readDir(PgExplorer.PATHS.ROOT_DIR_PATH);
        const lastWorkspaceName = rootDirs[rootDirs.length - 1];
        this._workspace.rename(lastWorkspaceName);
        // Update workspaces file
        await this._saveWorkspaces();

        await this._initCurrentWorkspace();

        return;
      }

      console.log("No workspace found. Most likely needs initial setup.");
    }

    // Runs when `indexedDB` is empty
    if (!Object.keys(this.files).length) {
      console.log("Setting up default FS...");
      // For backwards compatibility reasons, we check whether explorer key is used in localStorage
      // and move the localStorage FS to `indexedDB`.
      // TODO: delete this check after moving domains
      const lsExplorerStr = localStorage.getItem("explorer");
      if (lsExplorerStr) {
        // Create a default workspace
        this._workspace.new(PgWorkspace.DEFAULT_WORKSPACE_NAME);
        // Save workspaces
        await this._saveWorkspaces();

        const lsExplorer: ExplorerJSON = JSON.parse(lsExplorerStr);
        const lsFiles = lsExplorer.files;
        for (const path in lsFiles) {
          const oldData = lsFiles[path];
          delete lsFiles[path];
          lsFiles[
            path.replace(
              PgExplorer.PATHS.ROOT_DIR_PATH,
              this.currentWorkspacePath
            )
          ] = {
            content: oldData.content,
            // @ts-ignore // ignoring because the type of oldData changed
            meta: { current: oldData.current, tabs: oldData.tabs },
          };
        }
        this._explorer.files = lsFiles;
      } else {
        // There are no files in state and `indexedDB`
        // return and show create a project option
        return;
      }

      // Save file(s) to `indexedDB`
      await this._writeAllFromState();

      // Create tab info file
      await this.saveMeta();
    }

    // Load metadata info from `indexedDB`
    const metaFile = await this.fs.readToJSONOrDefault<ItemMetaFile>(
      PgWorkspace.METADATA_PATH,
      {}
    );

    for (const path in metaFile) {
      if (this.files[this.currentWorkspacePath + path]?.content !== undefined) {
        this.files[this.currentWorkspacePath + path].meta = metaFile[path];
      }
    }
  }

  /** Write all state data to `indexedDB`. */
  private static async _writeAllFromState() {
    for (const path in this.files) {
      const itemType = PgExplorer.getItemTypeFromPath(path);
      if (itemType.file) {
        await this.fs.writeFile(path, this.files[path].content ?? "", {
          createParents: true,
        });
      } else {
        await this.fs.createDir(path, { createParents: true });
      }
    }
  }

  /**
   * Read workspaces config from `indexedDB`.
   *
   * @returns the workspaces state
   */
  private static async _getWorkspaces() {
    return await this.fs.readToJSONOrDefault(
      PgWorkspace.WORKSPACES_CONFIG_PATH,
      PgWorkspace.DEFAULT
    );
  }

  /** Initialize workspaces from `indexedDB` to state. */
  private static async _initWorkspaces() {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    const workspaces = await this._getWorkspaces();
    this._workspace.setCurrent(workspaces);

    await this._saveWorkspaces();
  }

  /** Saves workspaces from state to `indexedDB`. */
  private static async _saveWorkspaces() {
    if (this._workspace) {
      await this.fs.writeFile(
        PgWorkspace.WORKSPACES_CONFIG_PATH,
        JSON.stringify(this._workspace.get()),
        { createParents: true }
      );
    }
  }

  /**
   * @param name workspace name
   * @returns the full path to the workspace root dir with '/' at the end
   */
  private static _getWorkspacePath(name: string) {
    return PgExplorer.PATHS.ROOT_DIR_PATH + PgCommon.appendSlash(name);
  }

  /**
   * Change current file to the last opened tab if it exists
   */
  private static _changeCurrentFileToTheLastTab() {
    const tabs = this.getTabs();
    if (!tabs.length) return;

    const lastTabPath = tabs[tabs.length - 1].path;
    this.changeCurrentFile(lastTabPath);
  }

  /* --------------------------- Utilities --------------------------- */

  /** Paths */
  static readonly PATHS = {
    ROOT_DIR_PATH: "/",
    SRC_DIRNAME: "src",
    CLIENT_DIRNAME: "client",
    TESTS_DIRNAME: "tests",
  };

  static getItemNameFromPath(path: string) {
    const itemsArr = path.split("/");
    const itemType = this.getItemTypeFromPath(path);

    if (itemType.file) return itemsArr[itemsArr.length - 1];
    else return itemsArr[itemsArr.length - 2];
  }

  // TODO: Implement a better identifier
  static getItemTypeFromName(itemName: string) {
    if (itemName.includes(".")) return { file: true };
    return { folder: true };
  }

  static getItemTypeFromPath(path: string) {
    if (path.endsWith("/")) return { folder: true };
    return { file: true };
  }

  static getItemTypeFromEl(el: HTMLDivElement) {
    if (el.classList.contains(ClassName.FOLDER)) {
      return { folder: true };
    } else if (el.classList.contains(ClassName.FILE)) {
      return { file: true };
    }

    return null;
  }

  static getItemPathFromEl(el: HTMLDivElement) {
    return el?.getAttribute("data-path");
  }

  static getLanguageFromPath(path: string) {
    const splitByDot = path.split(".");
    if (!splitByDot?.length) {
      return null;
    }

    let langExtension;
    if (splitByDot.length === 2) {
      langExtension = splitByDot[splitByDot.length - 1];
    } else {
      langExtension =
        splitByDot[splitByDot.length - 2] + splitByDot[splitByDot.length - 1];
    }

    switch (langExtension) {
      case "rs":
        return Lang.RUST;
      case "py":
        return Lang.PYTHON;
      case "js":
        return Lang.JAVASCRIPT;
      case "ts":
        return Lang.TYPESCRIPT;
      case "testjs":
        return Lang.JAVASCRIPT_TEST;
      case "testts":
        return Lang.TYPESCRIPT_TEST;
      case "json":
        return Lang.JSON;
    }
  }

  static getIsItemClientFromEl(el: HTMLDivElement) {
    const path = this.getItemPathFromEl(el);
    if (!path) return false;
    const lang = this.getLanguageFromPath(path);
    return (
      !!path &&
      !path.includes(".test") &&
      (lang === Lang.JAVASCRIPT || lang === Lang.TYPESCRIPT)
    );
  }

  static getIsItemTestFromEl(el: HTMLDivElement) {
    const path = this.getItemPathFromEl(el);
    if (!path) return false;
    const lang = this.getLanguageFromPath(path);
    return (
      !!path && (lang === Lang.JAVASCRIPT_TEST || lang === Lang.TYPESCRIPT_TEST)
    );
  }

  /**
   * Gets the parent folder path with '/' appended at the end.
   */
  static getParentPathFromPath(path: string) {
    const itemType = this.getItemTypeFromPath(path);

    const names = path.split("/");
    const parentPath = path
      .split("/")
      .filter((_itemName, i) => i !== names.length - (itemType.file ? 1 : 2))
      .reduce((acc, itemName) => {
        if (itemName) return (acc += `/${itemName}`);
        return acc;
      });

    return parentPath + "/";
  }

  static getParentPathFromEl = (selected: HTMLDivElement | null) => {
    if (!selected) return null;

    const itemType = this.getItemTypeFromEl(selected);

    if (itemType?.folder) {
      return selected?.getAttribute("data-path");
    } else if (itemType?.file) {
      // The file's owner folder is parent element's previous sibling
      return selected.parentElement!.previousElementSibling!.getAttribute(
        "data-path"
      );
    }

    return null;
  };

  static getElFromPath(path: string) {
    return document.querySelector(`[data-path='${path}']`) as HTMLDivElement;
  }

  static getRootFolderEl() {
    return document.getElementById(Id.ROOT_DIR);
  }

  static getSelectedEl = () => {
    return document.getElementsByClassName(
      ClassName.SELECTED
    )[0] as HTMLDivElement;
  };

  static setSelectedEl = (newEl: HTMLDivElement) => {
    const selectedEl = this.getSelectedEl();
    selectedEl?.classList.remove(ClassName.SELECTED);
    newEl.classList.add(ClassName.SELECTED);
  };

  static getCtxSelectedEl() {
    const ctxSelectedEls = document.getElementsByClassName(
      ClassName.CTX_SELECTED
    );
    if (ctxSelectedEls.length) return ctxSelectedEls[0];
  }

  static setCtxSelectedEl = (newEl: HTMLDivElement) => {
    this.removeCtxSelectedEl();
    newEl.classList.add(ClassName.CTX_SELECTED);
  };

  static removeCtxSelectedEl() {
    PgExplorer.getCtxSelectedEl()?.classList.remove(ClassName.CTX_SELECTED);
  }

  static openFolder = (el: HTMLDivElement) => {
    // Folder icon
    el.classList.add(ClassName.OPEN);

    // Toggle inside folder
    const insideFolderEl = el.nextElementSibling;
    if (insideFolderEl) insideFolderEl.classList.remove(ClassName.HIDDEN);
  };

  static toggleFolder = (el: HTMLDivElement) => {
    // Folder icon
    el.classList.toggle(ClassName.OPEN);

    // Toggle inside folder
    const insideFolderEl = el.nextElementSibling;
    if (insideFolderEl) insideFolderEl.classList.toggle(ClassName.HIDDEN);
  };

  static openAllParents(path: string) {
    for (;;) {
      const parentPath = this.getParentPathFromPath(path);
      const parentEl = this.getElFromPath(parentPath);

      if (!parentEl) break;

      this.openFolder(parentEl);
      if (parentPath === "/") break;

      path = parentPath;
    }
  }

  static collapseAllFolders() {
    const rootEl = this.getRootFolderEl();
    if (!rootEl) return;

    // Remove selected
    const selectedEl = this.getSelectedEl();
    if (selectedEl) selectedEl.classList.remove(ClassName.SELECTED);

    const recursivelyCollapse = (el: HTMLElement) => {
      if (!el || !el.childElementCount) return;

      // Close folders
      el.childNodes.forEach((child) => {
        const c = child as HTMLElement;
        if (c.classList.contains(ClassName.FOLDER)) {
          c.classList.remove(ClassName.OPEN);
        } else if (c.classList.contains(ClassName.FOLDER_INSIDE)) {
          c.classList.add(ClassName.HIDDEN);
          recursivelyCollapse(c);
        }
      });
    };

    recursivelyCollapse(rootEl);
  }

  static isItemNameValid(name: string) {
    return (
      name.match(/^(?!\.)[\w.-]+$/) &&
      !name.includes("//") &&
      !name.includes("..")
    );
  }
}
