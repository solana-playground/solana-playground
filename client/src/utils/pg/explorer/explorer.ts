import FS, { PromisifiedFS } from "@isomorphic-git/lightning-fs";
import { SetStateAction } from "jotai";
import { Dispatch } from "react";

import { ClassName, Id, ItemError, WorkspaceError } from "../../../constants";
import { PgProgramInfo } from "../program-info";
import { PgWorkspace, Workspaces } from "./workspace";

export interface ExplorerJSON {
  files: Files;
}

type Files = {
  [key: string]: ItemInfo;
};

interface ItemInfo {
  content?: string;
  current?: boolean;
  tabs?: boolean;
}

export interface FullFile extends ItemInfo {
  path: string;
}

export interface Folder {
  folders: string[];
  files: string[];
}

interface TabFile {
  /** Relative paths of the tabs */
  tabs: string[];
  /** Relative path of the current file */
  currentPath?: string;
}

/** Build request format files */
export type BuildFiles = string[][];

/**
 * Class that has both static and non-static methods for explorer.
 */
export class PgExplorer {
  /** Non-static methods */

  // Internal state
  private _explorer: ExplorerJSON;
  // IndexedDB FS object
  private _fs?: PromisifiedFS;
  // Workspace functionality
  private _workspace?: PgWorkspace;
  // Whether the user is on a shared page
  private _shared?: boolean;
  // To update ui
  private _refresh: () => void;

  /**
   * @param explorer state is shared if this param is supplied
   */
  constructor(
    refresh: Dispatch<SetStateAction<number>>,
    explorer?: ExplorerJSON
  ) {
    if (explorer) {
      this._shared = true;
      this._explorer = explorer;
    } else {
      this._fs = new FS(PgExplorer._INDEXED_DB_NAME).promises;
      this._explorer = {
        files: {},
      };
      this._workspace = new PgWorkspace();
    }

    this._refresh = () => refresh((c) => c + 1);
  }

  /** Get whether the current page is shared */
  get isShared() {
    return this._shared;
  }

  /** Get explorer files */
  get files() {
    return this._explorer.files;
  }

  /** Get full path of current workspace */
  get currentWorkspacePath() {
    return this._getWorkspacePath(
      this.currentWorkspaceName ?? PgWorkspace.DEFAULT_WORKSPACE_NAME
    );
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
  private get _tabInfoPath() {
    return this.currentWorkspacePath + PgWorkspace.TABINFO_PATH;
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
  async init(workspace?: string): Promise<PgExplorer> {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    if (workspace) {
      this._workspace.setCurrentName(workspace);

      // Update workspaces file
      await this._saveWorkspaces();

      this._explorer.files = {};
    } else {
      // Get current workspace
      const getCurrentWorkspace = async () => {
        try {
          const workspacesStr = await this._readToString(
            PgWorkspace.WORKSPACES_CONFIG_PATH
          );
          const workspaces: Workspaces = JSON.parse(workspacesStr);
          return workspaces;
        } catch {
          // Create default workspaces file
          const defaultWorkspaces = PgWorkspace.default();
          await this._saveWorkspaces();
          return defaultWorkspaces;
        }
      };

      const currentWorkspace = await getCurrentWorkspace();
      this._workspace.setCurrent(currentWorkspace);
    }

    const fs = this._getFs();

    // Sets up the files from IndexedDB to the state
    const setupFiles = async (path: string) => {
      const itemNames = await fs.readdir(path);
      if (!itemNames.length) {
        // Empty directory
        this.files[path] = {};
        return;
      }

      const subItemPaths = itemNames.map((itemName) => path + "/" + itemName);
      for (const subItemPath of subItemPaths) {
        const stat = await fs.stat(subItemPath);
        if (stat.isFile()) {
          const content = await this._readToString(subItemPath);
          this.files[subItemPath] = { content };
        } else {
          await setupFiles(subItemPath);
        }
      }
    };

    try {
      await setupFiles(PgExplorer.ROOT_DIR_PATH + this.currentWorkspaceName);
    } catch {
      console.log(
        "Couldn't setup files from IndexedDB. Probably need initial setup."
      );
    }

    // Runs when IndexedDB is empty
    if (!Object.keys(this.files).length) {
      console.log("Setting up default FS...");
      // For backwards compatibility reasons, we check whether explorer key is used in localStorage
      // and move the localStorage FS to IndexedDB.
      // TODO: delete this check after moving domains
      const lsExplorerStr = localStorage.getItem("explorer");
      if (lsExplorerStr) {
        const lsExplorer: ExplorerJSON = JSON.parse(lsExplorerStr);
        const lsFiles = lsExplorer.files;
        for (const path in lsFiles) {
          const data = lsFiles[path];
          delete lsFiles[path];
          lsFiles[
            path.replace(PgExplorer.ROOT_DIR_PATH, this.currentWorkspacePath)
          ] = data;
        }
        this._explorer.files = lsFiles;
      } else {
        // Show the default explorer if the files are empty
        this._explorer = PgExplorer._default();
      }

      // Save file(s) to IndexedDB
      for (const path in this.files) {
        const itemType = PgExplorer.getItemTypeFromPath(path);
        if (itemType.file) {
          await this._writeFile(path, this.files[path].content ?? "", true);
        } else {
          await this._mkdir(path, true);
        }
      }

      // Create tab info file
      await this.saveTabs(true);
    }

    // Load tab info from IndexedDB
    const tabStr = await this._readToString(this._tabInfoPath);
    const tabFile: TabFile = JSON.parse(tabStr);

    for (const relativePath of tabFile.tabs) {
      this.files[this.currentWorkspacePath + relativePath].tabs = true;
    }
    if (tabFile.currentPath) {
      this.files[this.currentWorkspacePath + tabFile.currentPath].current =
        true;
    }

    return this;
  }

  /**
   * Saves tab and current file info to IndexedDB
   *
   * NOTE: Only runs when the project is not shared.
   */
  async saveTabs(initial?: boolean) {
    if (!this.isShared) {
      if (initial) {
        const tabFile: TabFile = { tabs: [] };
        await this._writeFile(this._tabInfoPath, JSON.stringify(tabFile), true);
        return;
      }

      const files = this.files;

      const getRelativePath = (p: string) => {
        return p.split(this.currentWorkspacePath)[1];
      };

      const tabs = [];
      let currentPath;
      for (const path in files) {
        const itemInfo = files[path];
        if (itemInfo?.tabs) tabs.push(getRelativePath(path));
        if (itemInfo?.current) currentPath = getRelativePath(path);
      }

      const tabFile: TabFile = { tabs, currentPath };

      console.log(`Saving file ${this._tabInfoPath}, ${tabFile.currentPath}`);

      await this._writeFile(this._tabInfoPath, JSON.stringify(tabFile), true);
    }
  }

  /**
   * Saves file to IndexedDB.
   *
   * NOTE: This function assumes parent directories exist.
   */
  async saveFileToIndexedDB(path: string, data: string) {
    if (!this.isShared) await this._fs?.writeFile(path, data);
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
  async newItem(fullPath: string) {
    // Invalid name
    if (
      !PgExplorer.isItemNameValid(PgExplorer.getItemNameFromPath(fullPath)!)
    ) {
      throw new Error(ItemError.INVALID_NAME);
    }

    const files = this.files;

    // Already exists
    if (files[fullPath]) throw new Error(ItemError.ALREADY_EXISTS);

    const itemType = PgExplorer.getItemTypeFromPath(fullPath);

    // Ordering of IndexedDB calls and state calls matter. If IndexedDB call fails,
    // state will not change. Can't say the same if the ordering was in reverse.
    if (itemType.file) {
      if (!this.isShared) {
        await this._writeFile(fullPath, "", true);
        await this.saveTabs();
      }

      files[fullPath] = {
        content: "",
        current: true,
        tabs: true,
      };

      this.changeCurrentFile(fullPath);
    } else {
      // Folder
      if (!this.isShared) {
        await this._mkdir(fullPath);
      }

      files[fullPath] = {};
    }

    await this.saveTabs();
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
  async renameItem(fullPath: string, newName: string) {
    if (!PgExplorer.isItemNameValid(newName)) {
      console.log(newName, fullPath);
      throw new Error(ItemError.INVALID_NAME);
    }

    const files = this.files;

    const itemType = PgExplorer.getItemTypeFromPath(fullPath);
    const newItemType = PgExplorer.getItemTypeFromName(newName);
    if (
      (itemType.file && !newItemType.file) ||
      (itemType.folder && !newItemType.folder)
    ) {
      throw new Error(ItemError.TYPE_MISMATCH);
    }

    const parentFolder = PgExplorer.getParentPathFromPath(fullPath);

    // Check to see if newName already exists
    const newPath = itemType.file
      ? parentFolder + newName
      : parentFolder + newName + "/";
    if (files[newPath]) throw new Error(ItemError.ALREADY_EXISTS);

    if (!this.isShared) {
      // Rename in IndexedDB
      const fs = this._getFs();
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

    await this.saveTabs();
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
    // Can't delete src folder
    if (fullPath === this._getCurrentSrcPath()) {
      throw new Error(ItemError.SRC_DELETE);
    }

    if (!this.isShared) {
      const fs = this._getFs();

      const stat = await fs.stat(fullPath);
      if (stat.isFile()) await fs.unlink(fullPath);
      else await this._rmdir(fullPath, true);
    }

    const files = this.files;

    const isCurrentFile = files[fullPath]?.current;

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
    if (isCurrentFile || isCurrentParent) this.changeCurrentFileToTheLastTab();

    await this.saveTabs();
  }

  /**
   * Create a new workspace and change the current workspace to the created workspace
   * @param name new workspace name
   */
  async newWorkspace(name: string) {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    // Save tabs before initializing so data is never lost
    await this.saveTabs();

    // Create a new workspace in state
    this._workspace.new(name);

    // Create src folder
    await this._mkdir(this._getCurrentSrcPath(), true);

    await this.changeWorkspace(name, true);
  }

  /**
   * Change the current workspace to the given workspace
   * @param name workspace name to change to
   */
  async changeWorkspace(name: string, initial?: boolean) {
    // Save tabs before changing the workspace to never lose data
    await this.saveTabs(initial);

    await this.init(name);

    this._refresh();
  }

  /**
   * Rename the current workspace
   * @param newName new workspace name
   */
  async renameWorkspace(newName: string) {
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }

    await this.renameItem(this.currentWorkspacePath, newName);

    // Create a new workspace in state
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

    // Delete from state
    this._workspace.delete(this.currentWorkspaceName!);

    await this.deleteItem(this.currentWorkspacePath);

    const workspaceCount = this._workspace.allNames.length;
    if (workspaceCount) {
      const lastWorkspace = this._workspace.allNames[workspaceCount - 1];
      await this.changeWorkspace(lastWorkspace, true);
    } else {
      this._workspace.setCurrent({ allNames: [] });
      this._refresh();
    }
  }

  /** State methods */

  /**
   * Save the file to the state only.
   */
  saveFileToState(path: string, content: string) {
    const files = this.files;

    if (files[path]) files[path].content = content;
  }

  /**
   * Gets all the files from state that are in tabs
   */
  getTabs() {
    const files = this.files;
    const tabs: FullFile[] = [];

    for (const path in files) {
      const fileInfo: ItemInfo = files[path];

      if (fileInfo.tabs)
        tabs.push({
          path,
          current: fileInfo.current,
        });
    }

    return tabs;
  }

  /**
   * Gets the current opened file from state if it exists
   */
  getCurrentFile() {
    const files = this.files;

    for (const path in files) {
      const fileInfo: ItemInfo = files[path];

      if (fileInfo.current) {
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
    const files = this.files;

    const curFile = this.getCurrentFile();

    if (curFile) files[curFile.path].current = false;

    // Add file to the tabs and current
    files[newPath].tabs = true;
    files[newPath].current = true;
  }

  /**
   * Changes current file to the last opened tab if it exists
   */
  changeCurrentFileToTheLastTab() {
    const tabs = this.getTabs();
    if (!tabs.length) return;

    const lastTabPath = tabs[tabs.length - 1].path;
    this.changeCurrentFile(lastTabPath);
  }

  /**
   * Closes the tab and changes the current file to the last opened tab if it exists
   */
  closeTab(path: string) {
    const files = this.files;
    files[path].tabs = false;

    // If we are closing the current file, change current file to the last tab
    if (files[path].current) {
      files[path].current = false;
      this.changeCurrentFileToTheLastTab();
    }
  }

  /**
   * Gets items inside the folder and groups them into `folders` and `files`
   */
  getFolderContent(path: string) {
    const files = this.files;
    const filesAndFolders: Folder = { folders: [], files: [] };

    for (const itemPath in files) {
      if (itemPath.includes(path)) {
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
   * @returns the necessary data for the build request
   */
  getBuildFiles() {
    const files = this.files;
    const buildFiles: BuildFiles = [];

    const splitExtension = (fileName: string) => {
      const split = fileName.split(".");
      if (split.length === 1) {
        // file has no extension
        return [split[0], ""];
      } else {
        // remove the last part, which will be the extension
        const extension = split.pop() as string;
        return [split.join("."), extension];
      }
    };

    const updateIdRust = (content: string) => {
      return content.replace(/^(\s)*(\w*::)?declare_id!\("(\w*)"\)/gm, () => {
        const pk =
          PgProgramInfo.getPk().programPk ??
          PgProgramInfo.createNewKp().publicKey;
        return `declare_id!("${pk.toBase58()}")`;
      });
    };

    const updateIdPython = (content: string) => {
      return content.replace(/^declare_id\(("|')(\w*)("|')\)/gm, () => {
        const pk =
          PgProgramInfo.getPk().programPk ??
          PgProgramInfo.createNewKp().publicKey;
        return `declare_id('${pk.toBase58()}')`;
      });
    };

    const defaultFileNameWithoutExtension = splitExtension(
      PgExplorer._DEFAULT_FILE_PATH
    )[0];

    for (let path in files) {
      if (!path.startsWith(this._getCurrentSrcPath())) continue;

      let content = files[path].content;
      if (!content) continue;

      const [pathWithoutExtension, extension] = splitExtension(path);
      if (pathWithoutExtension === defaultFileNameWithoutExtension) {
        // Change program id
        if (extension === "rs") {
          content = updateIdRust(content);
        } else if (extension === "py") {
          content = updateIdPython(content);
        }
      }

      // We are removing the workspace from path because build only needs /src
      path = path.replace(this.currentWorkspacePath, PgExplorer.ROOT_DIR_PATH);

      buildFiles.push([path, content]);
    }

    return buildFiles;
  }

  /**
   * @returns the file content if it exists in the state
   */
  getFileContentFromPath(path: string) {
    path = path.startsWith("/") ? path.substring(1) : path;
    return this.files[this.currentWorkspacePath + path]?.content;
  }

  /**
   * @returns whether the current file in the state is rust
   */
  isCurrentFileRust() {
    return this.getCurrentFile()?.path.endsWith(".rs");
  }

  /**
   * @returns whether the user has any workspaces
   */
  hasWorkspaces() {
    return (this._workspace?.allNames?.length ?? 0) > 0;
  }

  /** Private methods */

  /**
   * @returns the in-memory FS.
   *
   * This function will throw an error if FS doesn't exist.
   */
  private _getFs() {
    const fs = this._fs;
    if (!fs) throw new Error(ItemError.FS_NOT_FOUND);
    return fs;
  }

  /**
   * @returns whether the given path exists
   */
  private async _exists(path: string) {
    try {
      const fs = this._getFs();
      await fs.stat(path);
      return true;
    } catch (e: any) {
      if (e.code === "ENOENT" || e.code === "ENOTDIR") return false;
      else {
        console.log("Unknown error in _exists: ", e);
        throw e;
      }
    }
  }

  /**
   * Creates new directory with create parents optionality
   */
  private async _mkdir(path: string, createParents?: boolean) {
    const fs = this._getFs();

    if (createParents) {
      const folders = path.split("/");
      let _path = "";
      for (let i = 1; i < folders.length - 1; i++) {
        _path += "/" + folders[i];

        // Only create if the dir doesn't exist
        const exists = await this._exists(_path);
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

    await this._getFs().writeFile(path, data);
  }

  /**
   * Reads file and returns the converted file string
   */
  private async _readToString(path: string) {
    const data = await this._getFs().readFile(path);
    return data.toString();
  }

  /**
   * Remove directory with recursive optionality
   */
  private async _rmdir(path: string, recursive?: boolean) {
    const fs = this._getFs();

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
   *
   * @returns current workspace's src directory path
   */
  private _getCurrentSrcPath() {
    return this.currentWorkspacePath + "src/";
  }

  /**
   * @param name workspace name
   * @returns the full path to the workspace root dir
   */
  private _getWorkspacePath(name: string) {
    return PgExplorer.ROOT_DIR_PATH + name + "/";
  }

  /** Static methods */
  static readonly ROOT_DIR_PATH = "/";

  /** Don't change this! */
  private static readonly _INDEXED_DB_NAME = "solana-playground";

  private static readonly _DEFAULT_FILE_PATH =
    this.ROOT_DIR_PATH + PgWorkspace.DEFAULT_WORKSPACE_NAME + "/src/lib.rs";
  private static readonly _DEFAULT_CODE = `use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("11111111111111111111111111111111");

#[program]
mod hello_anchor {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        ctx.accounts.new_account.data = data;
        msg!("Changed data to: {}!", data); // Message will show up in the tx logs
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // We must specify the space in order to initialize an account.
    // First 8 bytes are default account discriminator,
    // next 8 bytes come from NewAccount.data being type u64.
    // (u64 = 64 bits unsigned integer = 8 bytes)
    #[account(init, payer = signer, space = 8 + 8)]
    pub new_account: Account<'info, NewAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NewAccount {
    data: u64
}`;

  private static _default(): ExplorerJSON {
    return {
      files: {
        [this._DEFAULT_FILE_PATH]: {
          content: this._DEFAULT_CODE,
          tabs: false,
          current: false,
        },
      },
    };
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

  static getItemTypeFromEl = (el: HTMLDivElement) => {
    if (el.classList.contains(ClassName.FOLDER)) {
      return { folder: true };
    } else if (el.classList.contains(ClassName.FILE)) {
      return { file: true };
    }

    return null;
  };

  static getItemPathFromEl = (el: HTMLDivElement) => {
    return el?.getAttribute("data-path");
  };

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
    return document.getElementsByClassName(ClassName.CTX_SELECTED)[0];
  }

  static removeCtxSelectedEl() {
    this.getCtxSelectedEl()?.classList.remove(ClassName.CTX_SELECTED);
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
    let rootEl = this.getRootFolderEl();

    for (;;) {
      if (!rootEl || !rootEl.childElementCount) break;
      // Close folder
      rootEl.children[0]?.classList.remove(ClassName.OPEN);
      rootEl.children[1]?.classList.add(ClassName.HIDDEN);
      // Remove selected
      const selectedEl = this.getSelectedEl();
      if (selectedEl) selectedEl.classList.remove(ClassName.SELECTED);

      rootEl = rootEl?.children[1] as HTMLElement;
    }
  }

  static isItemNameValid(name: string) {
    return (
      name.match(/^(?!\.)[\w.-]+$/) &&
      !name.includes("//") &&
      !name.includes("..")
    );
  }

  static getExplorerIconsPath(name: string) {
    return "icons/explorer/" + name;
  }
}
