import FS, { PromisifiedFS } from "@isomorphic-git/lightning-fs";
import { Keypair } from "@solana/web3.js";

import { PgGithub } from "./github";
import { PgWorkspace, Workspaces } from "./workspace";
import { PgProgramInfo } from "../program-info";
import { Lang } from "./frameworks";
import { PgCommon } from "../common";
import {
  ClassName,
  EventName,
  Id,
  ItemError,
  WorkspaceError,
} from "../../../constants";
import type {
  Disposable,
  Methods,
  ClassReturnType,
  TupleString,
} from "../types";

export interface ExplorerJSON {
  files: {
    [key: string]: ItemInfo;
  };
}

export interface FullFile extends ItemInfo {
  /** Full path to the file */
  path: string;
}

interface ItemInfo {
  /** Contents of the file */
  content?: string;
  /** Metadata about the file */
  meta?: ItemMeta;
}

interface ItemMetaFile {
  /** [Relative path]: ItemMeta */
  [key: string]: ItemMeta;
}

interface ItemMeta {
  /** Whether the file is the current file */
  current?: boolean;
  /** Whether the file is in tabs */
  tabs?: boolean;
  /** Editor's visible top line number */
  topLineNumber?: number;
}

export interface Folder {
  folders: string[];
  files: string[];
}

/** Array<[Path, Content]> */
export type Files = TupleString[];

/**
 * Class that has both static and non-static methods for explorer.
 */
export class PgExplorer {
  /** Non-static methods */

  /** Internal state */
  private _explorer: ExplorerJSON;
  /** IndexedDB FS object */
  private _fs: PromisifiedFS;
  /** Workspace functionality */
  private _workspace?: PgWorkspace;
  /** Whether the user is on a shared page */
  private _shared?: boolean;
  /** To update ui */
  private _refresh: () => void;

  /**
   * @param explorer state is shared if this param is supplied
   */
  constructor(refresh: () => void, explorer?: ExplorerJSON) {
    if (explorer) {
      this._shared = true;
      this._explorer = explorer;
    } else {
      this._explorer = {
        files: {},
      };
      this._workspace = new PgWorkspace();
    }

    this._fs = new FS(PgExplorer._INDEXED_DB_NAME).promises;
    this._refresh = refresh;
  }

  /** Get whether the current page is shared */
  get isShared() {
    return this._shared;
  }

  /** Get explorer files */
  get files() {
    return this._explorer.files;
  }

  /**
   * Get full path of current workspace('/' appended)
   *
   * @throws if the workspace doesn't exist. Shouldn't be called on shared projects.
   */
  get currentWorkspacePath() {
    if (!this.currentWorkspaceName) {
      throw new Error(WorkspaceError.CURRENT_NOT_FOUND);
    }

    return this._getWorkspacePath(this.currentWorkspaceName);
  }

  /** Get current workspace name */
  get currentWorkspaceName() {
    return this._workspace?.currentName;
  }

  /** Get names of all workspaces */
  get allWorkspaceNames() {
    return this._workspace?.allNames;
  }

  /** Get current workspace's tab info file path */
  private get _metadataPath() {
    return this.currentWorkspacePath + PgWorkspace.METADATA_PATH;
  }

  /** Public methods */

  /**
   * Initialize explorer with the specified workspace or the default workspace.
   *
   * Only the current workspace will be in the memory.
   *
   * @param workspace (optional) workspace name to set the current workspace
   *
   * IMPORTANT: This function must be called after constructing the class
   * if the project is not shared.
   */
  async init(workspace?: string) {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    if (workspace) {
      this._workspace.setCurrentName(workspace);

      // Update workspaces file
      await this._saveWorkspaces();

      this._explorer.files = {};
    } else {
      // Initialize workspaces
      await this._initializeWorkspaces();
    }

    const fs = this._fs;

    // Sets up the files from IndexedDB to the state
    const setupFiles = async (path: string) => {
      const itemNames = await fs.readdir(path);

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
        const stat = await fs.stat(subItemPath);
        if (stat.isFile()) {
          try {
            // This might fail if the user closes the window when a file delete
            // operation has not been completed yet
            const content = await this.readToString(subItemPath);
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
        const rootDirs = await fs.readdir(PgExplorer.PATHS.ROOT_DIR_PATH);
        const lastWorkspaceName = rootDirs[rootDirs.length - 1];
        this._workspace.rename(lastWorkspaceName);
        await this.init(lastWorkspaceName);

        return;
      }

      console.log("No workspace found. Most likely needs initial setup.");
    }

    // Runs when IndexedDB is empty
    if (!Object.keys(this.files).length) {
      console.log("Setting up default FS...");
      // For backwards compatibility reasons, we check whether explorer key is used in localStorage
      // and move the localStorage FS to IndexedDB.
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
        // There are no files in state and IndexedDB
        // return and show create a project option
        return;
      }

      // Save file(s) to IndexedDB
      await this._writeAllFromState();

      // Create tab info file
      await this.saveMeta();
    }

    // Load metadata info from IndexedDB
    let metaFile: ItemMetaFile;
    try {
      const metaStr = await this.readToString(this._metadataPath);
      metaFile = JSON.parse(metaStr);
    } catch {
      metaFile = {};
    }

    for (const path in metaFile) {
      if (this.files[this.currentWorkspacePath + path]?.content !== undefined) {
        this.files[this.currentWorkspacePath + path].meta = metaFile[path];
      }
    }
  }

  /**
   * Saves file metadata to IndexedDB
   *
   * NOTE: Only runs when the project is not shared.
   */
  async saveMeta(options?: { initial?: boolean }) {
    if (this.isShared || !this.currentWorkspaceName) return;

    if (options?.initial) {
      const metaFile: ItemMeta = {};
      await this._writeFile(this._metadataPath, JSON.stringify(metaFile), true);
      return;
    }

    const files = this.files;

    const metaFile: ItemMetaFile = {};
    for (const path in files) {
      metaFile[this.getRelativePath(path)] = { ...files[path].meta };
    }

    const metaFilePath = Object.keys(metaFile).find((k) =>
      k.includes(PgWorkspace.METADATA_PATH)
    );

    // Save meta file if it doesn't exist
    if (!metaFilePath) {
      await this._writeFile(this._metadataPath, JSON.stringify(metaFile), true);
    }
    // Only save when relative paths are correct to not lose metadata on some rare cases
    else if (metaFilePath.startsWith(PgWorkspace.METADATA_PATH)) {
      await this._writeFile(this._metadataPath, JSON.stringify(metaFile), true);
    }
  }

  /**
   * Saves file to IndexedDB.
   *
   * NOTE: This function assumes parent directories exist.
   */
  async saveFileToIndexedDB(path: string, data: string) {
    if (!this.isShared) await this._fs.writeFile(path, data);
  }

  /**
   * If the project is not shared(default):
   * - Name and path checks
   * - Create new item in IndexedDB
   * - If create is successful, also create the item in the state
   *
   * If the project is shared:
   * - Name and path checks
   * - Create item in the state
   */
  async newItem(
    fullPath: string,
    content: string = "",
    opts?: {
      skipNameValidation?: boolean;
      override?: boolean;
      openOptions?: {
        dontOpen?: boolean;
        onlyOpenIfAlreadyOpen?: boolean;
      };
    }
  ) {
    fullPath = this._convertToFullPath(fullPath);

    // Invalid name
    if (
      !opts?.skipNameValidation &&
      !PgExplorer.isItemNameValid(PgExplorer.getItemNameFromPath(fullPath)!)
    ) {
      throw new Error(ItemError.INVALID_NAME);
    }

    const files = this.files;

    // Already exists
    if (files[fullPath] && !opts?.override) {
      throw new Error(ItemError.ALREADY_EXISTS);
    }

    const itemType = PgExplorer.getItemTypeFromPath(fullPath);

    // Ordering of IndexedDB calls and state calls matter. If IndexedDB call fails,
    // state will not change. Can't say the same if the ordering was in reverse.
    if (itemType.file) {
      if (!this.isShared) {
        await this._writeFile(fullPath, content, true);
        await this.saveMeta();
      }

      files[fullPath] = {
        content,
        meta: files[fullPath]?.meta ?? {},
      };

      const isCurrentFile = this.getCurrentFile()?.path === fullPath;

      if (!opts?.openOptions || opts?.openOptions?.onlyOpenIfAlreadyOpen) {
        // Close the file if we are overriding to correctly display the new content
        if (opts?.override && isCurrentFile) {
          this.closeTab(fullPath);
        }

        if (!opts?.openOptions || isCurrentFile) {
          this.changeCurrentFile(fullPath);
        } else {
          this._refresh();
        }
      }
    } else {
      // Folder
      if (!this.isShared) {
        await this._mkdir(fullPath);
      }

      files[fullPath] = {};

      this._refresh();
    }

    await this.saveMeta();
  }

  /**
   * If the project is not shared(default):
   * - Name and path checks
   * - Rename in IndexedDB
   * - If rename is successful also rename item in the state
   *
   * If the project is shared:
   * - Name and path checks
   * - Rename in state
   */
  async renameItem(
    fullPath: string,
    newName: string,
    options?: { skipNameValidation?: boolean }
  ) {
    fullPath = this._convertToFullPath(fullPath);

    if (!options?.skipNameValidation && !PgExplorer.isItemNameValid(newName)) {
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

    // Rename in IndexedDB
    if (!this.isShared) {
      const fs = this._fs;
      await fs.rename(fullPath, newPath);
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

    this._dispatchOnDidSwitchFile(this.getFullFile()!);

    this._refresh();

    await this.saveMeta();
  }

  /**
   * If the project is not shared(default):
   * - Delete from IndexedDB(recursively)
   * - If delete is successful, delete from state
   *
   * If the project is shared:
   * - Delete from state
   */
  async deleteItem(fullPath: string) {
    fullPath = this._convertToFullPath(fullPath);

    // Can't delete src folder
    if (fullPath === this.getCurrentSrcPath()) {
      throw new Error(ItemError.SRC_DELETE);
    }

    if (!this.isShared) {
      const fs = this._fs;

      const stat = await fs.stat(fullPath);
      if (stat.isFile()) await fs.unlink(fullPath);
      else await this._rmdir(fullPath, true);
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

    // If we delete all elements from a folder, the parent folder disappears too.
    // We are adding the folder back to mitigate that
    const parentPath = PgExplorer.getParentPathFromPath(fullPath);
    files[parentPath] = {};

    // Change current file to the last tab when current file is deleted
    // or current file's parent is deleted
    if (isCurrentFile || isCurrentParent) this._changeCurrentFileToTheLastTab();

    this._refresh();

    await this.saveMeta();
  }

  /**
   * Create a new workspace and change the current workspace to the created workspace
   * @param name new workspace name
   * @param options -
   * - files: Files to create the workspace from
   * - defaultOpenFile: Default file to open in the editor
   * - fromShared: Whether to create new workspace from a shared project
   */
  async newWorkspace(
    name: string,
    options?: { files?: Files; defaultOpenFile?: string; fromShared?: boolean }
  ) {
    name = name.trim();
    if (!name) throw new Error(WorkspaceError.INVALID_NAME);

    if (options?.fromShared && this.isShared) {
      // The reason we are not just getting the necessary files and re-calling this
      // function with { files } is because we would lose the tab info. Instead we
      // are creating a valid workspace state and writing it to IndexedDB.

      this._shared = false;
      this._fs = new FS(PgExplorer._INDEXED_DB_NAME).promises;
      this._workspace = new PgWorkspace();
      // Init workspace
      await this._initializeWorkspaces();
      // Create a new workspace in state
      this._workspace.new(name);

      // Change state paths(shared projects start with /src)
      for (const path in this.files) {
        const data = this.files[path];
        delete this.files[path];
        this.files[`/${name}${path}`] = data;
      }

      // Save everything from state to IndexedDB
      await this._writeAllFromState();

      // Save metadata
      await this.saveMeta({ initial: true });

      await this.changeWorkspace(name);

      return;
    }

    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    // Save metadata before initializing so data is never lost
    if (this.hasWorkspaces()) await this.saveMeta();

    // Create a new workspace in state
    this._workspace.new(name);

    // Create files
    if (options?.files) {
      for (const pathContent of options?.files) {
        const fullPath = this.currentWorkspacePath + pathContent[0];
        const content = pathContent[1];
        await this._writeFile(fullPath, content, true);
      }
    }

    await this.changeWorkspace(name, {
      initial: true,
      defaultOpenFile: options?.defaultOpenFile,
    });
  }

  /**
   * Change the current workspace to the given workspace
   * @param name workspace name to change to
   * @param options -
   * - initial: if changing to the given workspace for the first time
   * - defaultOpenFile: the file to open in the editor
   */
  async changeWorkspace(
    name: string,
    options?: { initial?: boolean; defaultOpenFile?: string }
  ) {
    // Save metadata before changing the workspace to never lose data
    await this.saveMeta(options);

    await this.init(name);

    // Open the default file if it has been specified
    if (options?.defaultOpenFile) {
      this.changeCurrentFile(
        this.currentWorkspacePath + options.defaultOpenFile
      );

      // Save metadata to never lose default open file
      await this.saveMeta();
    } else {
      this._dispatchOnDidSwitchFile(this.getFullFile()!);
    }

    this._refresh();

    PgCommon.createAndDispatchCustomEvent(
      EventName.EXPLORER_ON_DID_CHANGE_WORKSPACE
    );
  }

  /**
   * Rename the current workspace
   * @param newName new workspace name
   */
  async renameWorkspace(newName: string) {
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

    await this.changeWorkspace(newName);
  }

  /**
   * Delete the current workspace
   */
  async deleteWorkspace() {
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
      await this.changeWorkspace(lastWorkspace, { initial: true });
    } else {
      this._workspace.setCurrent({ allNames: [] });
      await this._saveWorkspaces();
      this._refresh();
    }

    PgCommon.createAndDispatchCustomEvent(
      EventName.EXPLORER_ON_DID_DELETE_WORKSPACE
    );
  }

  /**
   * Export the current workspace as a zip file
   */
  async exportWorkspace() {
    const fs = this._fs;

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    const recursivelyGetItems = async (path: string) => {
      const itemNames = await fs.readdir(path);
      if (!itemNames.length) return;

      const subItemPaths = itemNames
        .filter((itemName) => !itemName.startsWith("."))
        .map((itemName) => PgCommon.appendSlash(path) + itemName);

      for (const subItemPath of subItemPaths) {
        const stat = await fs.stat(subItemPath);
        const relativePath = this.getRelativePath(subItemPath);
        if (stat.isFile()) {
          const content = await this.readToString(subItemPath);
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
  async importFromGithub(url: string) {
    // Get repository info
    const { files, owner, repo, path } = await PgGithub.getImportableRepository(
      url
    );

    // Check whether the repository already exists in user's workspaces
    const githubWorkspaceName = `github-${owner}/${repo}/${path}`;
    if (this._workspace?.allNames.includes(githubWorkspaceName)) {
      // Switch to the existing workspace
      await this.changeWorkspace(githubWorkspaceName);
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

      // Save metadata
      await this.saveMeta();
    }
  }

  /**
   * @returns whether the given path exists
   */
  async exists(path: string) {
    path = this._convertToFullPath(path);

    try {
      await this._fs.stat(path);
      return true;
    } catch (e: any) {
      if (e.code === "ENOENT" || e.code === "ENOTDIR") return false;
      else {
        console.log("Unknown error in exists: ", e);
        throw e;
      }
    }
  }

  /**
   * Reads file and returns the converted file string
   */
  async readToString(path: string) {
    const data = await this._fs.readFile(this._convertToFullPath(path));
    return data.toString();
  }

  /** State methods */

  /**
   * Save the file to the state only.
   */
  saveFileToState(path: string, content: string) {
    path = this._convertToFullPath(path);
    if (this.files[path]) this.files[path].content = content;
  }

  /**
   * @returns all the files from state that are in tabs
   */
  getTabs() {
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
  getFullFile(path?: string): FullFile | null {
    if (!path) return this.getCurrentFile();
    path = this._convertToFullPath(path);
    const itemInfo = this.files[path];
    if (itemInfo) return { path, ...this.files[path] };
    return null;
  }

  /**
   * Gets the current opened file from state if it exists
   */
  getCurrentFile() {
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
  changeCurrentFile(newPath: string) {
    newPath = this._convertToFullPath(newPath);

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

    this._dispatchOnDidSwitchFile(this.getFullFile()!);

    this._refresh();
  }

  /**
   * Get the visible top line number in Editor from state
   *
   * @param path Full path to the file
   * @returns The top line number
   */
  getEditorTopLineNumber(path: string) {
    return this.files[path].meta?.topLineNumber;
  }

  /**
   * Save the first visible top line number in editor to state
   *
   * @param path Full path to the file
   * @param topLineNumber Visible top line number
   */
  saveEditorTopLineNumber(path: string, topLineNumber: number) {
    if (!this.files[path]) return;
    this.files[path].meta = { ...this.files[path].meta, topLineNumber };
  }

  /**
   * Closes the tab and changes the current file to the last opened tab if it exists
   */
  closeTab(path: string) {
    path = this._convertToFullPath(path);

    const files = this.files;
    files[path].meta!.tabs = false;

    // If we are closing the current file, change current file to the last tab
    if (files[path].meta?.current) {
      files[path].meta!.current = false;
      this._changeCurrentFileToTheLastTab();
    }

    this._refresh();
  }

  /**
   * Get file content from the state
   *
   * @param path full path to the file
   * @returns the file content from the state
   */
  getFileContent(path: string) {
    return this.files[this._convertToFullPath(path)]?.content;
  }

  /**
   * Gets items inside the folder and groups them into `folders` and `files`
   */
  getFolderContent(path: string) {
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
   * @param path path to be appended after the current workspace path
   * @returns full path based on the input
   */
  appendToCurrentWorkspacePath(path: string) {
    return PgCommon.appendSlash(
      this.currentWorkspacePath + PgCommon.withoutPreSlash(path)
    );
  }

  /**
   * @returns the necessary data for the build request
   */
  getBuildFiles() {
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

    // prioritise files where we are likely to find a rust declare_id
    const prioritiseFilePaths = (files: { [key: string]: ItemInfo }) => {
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
    const buildFiles: Files = [];

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
  getCurrentFileLanguage() {
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
  isCurrentFileJsLike() {
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
  isWorkspaceAnchor() {
    const libRsPath = this.getCurrentSrcPath() + "lib.rs";
    return this.files[libRsPath]?.content?.includes("anchor") ?? false;
  }

  /**
   * @returns whether the user has any workspaces
   */
  hasWorkspaces() {
    return (this._workspace?.allNames?.length ?? 0) > 0;
  }

  /**
   * Get the path without the workspace path prefix
   *
   * @param fullPath Full path
   * @returns Relative path
   */
  getRelativePath(fullPath: string) {
    if (this.isShared) {
      return fullPath;
    }

    const split = fullPath.split(this.currentWorkspacePath);
    if (split.length === 1) {
      return split[0];
    }

    return split[1];
  }

  /**
   * @returns current src directory path
   */
  getCurrentSrcPath() {
    const srcPath = this.isShared
      ? PgExplorer.PATHS.ROOT_DIR_PATH + PgExplorer.PATHS.SRC_DIRNAME
      : this.appendToCurrentWorkspacePath(PgExplorer.PATHS.SRC_DIRNAME);
    return PgCommon.appendSlash(srcPath);
  }

  /**
   * Runs after switching to a different file
   *
   * @param cb callback function to run after switching file
   * @returns a dispose function to clear the event
   */
  onDidSwitchFile(cb: (file: FullFile) => any): Disposable {
    type Event = UIEvent & { detail: any };

    const handle = (ev: Event) => {
      cb(ev.detail);
    };

    handle({ detail: this.getFullFile() } as Event);

    document.addEventListener(
      EventName.EXPLORER_ON_DID_SWITCH_FILE,
      handle as EventListener
    );
    return {
      dispose: () =>
        document.removeEventListener(
          EventName.EXPLORER_ON_DID_SWITCH_FILE,
          handle as EventListener
        ),
    };
  }

  /**
   * Runs after changing the workspace
   *
   * @param cb callback function to run after changing the workspace
   * @param initialRun whether to run the callback on first call, `true` by default
   * @returns a dispose function to clear the event
   */
  onDidChangeWorkspace(cb: () => any, initialRun: boolean = true): Disposable {
    if (initialRun) cb();

    document.addEventListener(EventName.EXPLORER_ON_DID_CHANGE_WORKSPACE, cb);

    return {
      dispose: () =>
        document.removeEventListener(
          EventName.EXPLORER_ON_DID_CHANGE_WORKSPACE,
          cb
        ),
    };
  }

  /**
   * Runs after deleting the current workspace
   *
   * @param cb callback function to run after deleting the current workspace
   * @returns a dispose function to clear the event
   */
  onDidDeleteWorkspace(cb: () => any): Disposable {
    document.addEventListener(EventName.EXPLORER_ON_DID_DELETE_WORKSPACE, cb);
    return {
      dispose: () =>
        document.removeEventListener(
          EventName.EXPLORER_ON_DID_DELETE_WORKSPACE,
          cb
        ),
    };
  }

  /** Private methods */

  /**
   * Creates new directory with create parents optionality
   */
  private async _mkdir(path: string, createParents?: boolean) {
    const fs = this._fs;

    if (createParents) {
      const folders = path.split("/");
      let _path = "";
      for (let i = 1; i < folders.length - 1; i++) {
        _path += "/" + folders[i];

        // Only create if the dir doesn't exist
        const exists = await this.exists(_path);
        if (!exists) await fs.mkdir(_path);
      }
    } else {
      await fs.mkdir(path);
    }
  }

  /**
   * Write file with create parents optionality.
   */
  private async _writeFile(
    path: string,
    data: string,
    createParents?: boolean
  ) {
    if (createParents) {
      const parentFolder = PgExplorer.getParentPathFromPath(path);
      await this._mkdir(parentFolder, true);
    }

    await this._fs.writeFile(path, data);
  }

  /**
   * Write all data in the state to IndexedDB
   */
  private async _writeAllFromState() {
    for (const path in this.files) {
      const itemType = PgExplorer.getItemTypeFromPath(path);
      if (itemType.file) {
        await this._writeFile(path, this.files[path].content ?? "", true);
      } else {
        await this._mkdir(path, true);
      }
    }
  }

  /**
   * Remove directory with recursive optionality
   */
  private async _rmdir(path: string, recursive?: boolean) {
    const fs = this._fs;

    if (recursive) {
      const recursivelyRmdir = async (dir: string[], currentPath: string) => {
        if (!dir.length) {
          // Delete if it's an empty directory
          await fs.rmdir(currentPath);
          return;
        }

        for (const childName of dir) {
          const childPath = currentPath + childName;
          const type = (await fs.stat(childPath)).type;
          if (type === "dir") {
            const childDir = await fs.readdir(childPath);
            if (childDir.length) {
              await recursivelyRmdir(childDir, childPath + "/");
            } else await fs.rmdir(childPath);
          } else {
            await fs.unlink(childPath);
          }
        }

        // Read the directory again and delete if it's empty
        const _dir = await fs.readdir(currentPath);
        if (!_dir.length) await fs.rmdir(currentPath);
      };

      const dir = await fs.readdir(path);
      await recursivelyRmdir(dir, path);
    } else {
      await fs.rmdir(path);
    }
  }

  /**
   * Initialize workspaces from IndexedDB to state
   */
  private async _initializeWorkspaces() {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    let workspaces: Workspaces;
    try {
      const workspacesStr = await this.readToString(
        PgWorkspace.WORKSPACES_CONFIG_PATH
      );
      workspaces = JSON.parse(workspacesStr);
    } catch {
      // Create default workspaces file
      const defaultWorkspaces = PgWorkspace.default();
      workspaces = defaultWorkspaces;
    }

    this._workspace.setCurrent(workspaces);
    await this._saveWorkspaces();
  }

  /**
   * Saves workspaces from state to IndexedDB
   */
  private async _saveWorkspaces() {
    if (this._workspace) {
      await this._writeFile(
        PgWorkspace.WORKSPACES_CONFIG_PATH,
        JSON.stringify(this._workspace.get()),
        true
      );
    }
  }

  /**
   * @param name workspace name
   * @returns the full path to the workspace root dir with '/' at the end
   */
  private _getWorkspacePath(name: string) {
    return PgExplorer.PATHS.ROOT_DIR_PATH + PgCommon.appendSlash(name);
  }

  /**
   * Change current file to the last opened tab if it exists
   */
  private _changeCurrentFileToTheLastTab() {
    const tabs = this.getTabs();
    if (!tabs.length) return;

    const lastTabPath = tabs[tabs.length - 1].path;
    this.changeCurrentFile(lastTabPath);
  }

  private _convertToFullPath(path: string) {
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
   * Dispatch onDidChangeCurrentFile custom event
   */
  private _dispatchOnDidSwitchFile(file: FullFile) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.EXPLORER_ON_DID_SWITCH_FILE,
      file
    );
  }

  /** Static methods */

  /** Paths */
  static readonly PATHS = {
    ROOT_DIR_PATH: "/",
    SRC_DIRNAME: "src",
    CLIENT_DIRNAME: "client",
    TESTS_DIRNAME: "tests",
  };

  /** Don't change this! */
  private static readonly _INDEXED_DB_NAME = "solana-playground";

  /**
   * Statically get the explorer object from state. This function will wait until
   * the explorer is not `null`.
   *
   * @returns the explorer object
   */
  static async get() {
    return await PgCommon.tryUntilSuccess(async () => {
      return await PgCommon.sendAndReceiveCustomEvent<PgExplorer>(
        PgCommon.getStaticEventNames(EventName.EXPLORER_STATIC).get
      );
    });
  }

  /**
   * Run any method of explorer in state from anywhere
   *
   * @param data method and its data to run
   * @returns the result from the method call
   */
  static async run<
    R extends ClassReturnType<PgExplorer, keyof M>,
    M extends Methods<PgExplorer>
  >(data: M) {
    return await PgCommon.sendAndReceiveCustomEvent<R, M>(
      PgCommon.getStaticEventNames(EventName.EXPLORER_STATIC).run,
      data
    );
  }

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

  static getLanguageFromPath(path: string = "") {
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

  static getExplorerIconsPath(name: string) {
    return "/icons/explorer/" + name;
  }
}
