import { PgExplorerEvent } from "./events";
import { PgFs } from "./fs";
import { Lang } from "./lang";
import { PgWorkspace } from "./workspace";
import { PgCommon } from "../common";
import { ClassName, Id, ItemError, WorkspaceError } from "../../../constants";
import type {
  Explorer,
  TupleFiles,
  Folder,
  FullFile,
  ItemMetaFile,
  ExplorerFiles,
  Position,
} from "./types";

/**
 * Class that has both static and non-static methods for explorer.
 */
export class PgExplorer {
  /** Internal state */
  private static readonly _explorer: Explorer = { files: {} };
  /** Workspace functionality */
  private static _workspace: PgWorkspace | null = null;
  /** Current initialized workspace name */
  private static _initializedWorkspaceName: string | null = null;
  /** Whether the current explorer state is temporary */
  private static _isTemporary: boolean;

  /** `indexedDB` file system */
  static fs = PgFs;

  /* ------------------------------- Getters ------------------------------- */

  /** Get whether the current workspace is temporary */
  static get isTemporary() {
    return this._isTemporary;
  }

  /** Get explorer files */
  static get files() {
    return this._explorer.files;
  }

  /**
   * Get full path of current workspace('/' appended)
   *
   * @throws if the workspace doesn't exist. Shouldn't be used with temporary projects.
   */
  static get currentWorkspacePath() {
    if (!this.currentWorkspaceName) {
      throw new Error(WorkspaceError.CURRENT_NOT_FOUND);
    }

    return PgCommon.joinPaths([
      PgExplorer.PATHS.ROOT_DIR_PATH,
      PgCommon.appendSlash(this.currentWorkspaceName),
    ]);
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
    if (params?.files) {
      this._isTemporary = true;
      this._workspace = null;
      this._explorer.files = this._addCurrentFileIfNeeded(params.files);
    }
    // Skip initializing if the workspace has already been initialized
    else if (
      this._initializedWorkspaceName ===
      (params?.name ?? this.currentWorkspaceName)
    ) {
    } else {
      this._isTemporary = false;
      if (!this._workspace) {
        this._workspace = new PgWorkspace();
        await this._initWorkspaces();
      }

      const workspaceName = params?.name ?? this.currentWorkspaceName;

      // Check whether the workspace exists
      if (workspaceName && this.allWorkspaceNames!.includes(workspaceName)) {
        await this.switchWorkspace(workspaceName);
      }
      // Reset files when there are no workspaces
      else if (this.allWorkspaceNames!.length === 0) {
        this._explorer.files = {};
      }
    }

    PgExplorerEvent.dispatchOnDidInit();
  }

  /**
   * If the project is not temporary(default):
   * - Name and path checks
   * - Create new item in `indexedDB`
   * - If create is successful, also create the item in the state
   *
   * If the project is temporary:
   * - Name and path checks
   * - Create item in the state
   */
  static async newItem(
    path: string,
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
    const fullPath = this.convertToFullPath(path);

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
      if (!this.isTemporary) {
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
        }
      }
    } else {
      // Folder
      if (!this.isTemporary) {
        await this.fs.createDir(fullPath);
      }

      files[fullPath] = {};
    }

    PgExplorerEvent.dispatchOnDidCreateItem();

    await this.saveMeta();
  }

  /**
   * If the project is not temporary(default):
   * - Name and path checks
   * - Rename in `indexedDB`
   * - If rename is successful also rename item in the state
   *
   * If the project is temporary:
   * - Name and path checks
   * - Rename in state
   */
  static async renameItem(
    path: string,
    newName: string,
    opts?: { skipNameValidation?: boolean }
  ) {
    const fullPath = this.convertToFullPath(path);

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
      newPath = PgCommon.joinPaths([
        PgExplorer.PATHS.ROOT_DIR_PATH,
        PgCommon.appendSlash(newName),
      ]);
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
    if (!this.isTemporary) await this.fs.rename(fullPath, newPath);

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
    PgExplorerEvent.dispatchOnDidRenameItem(fullPath);

    await this.saveMeta();
  }

  /**
   * If the project is not temporary(default):
   * - Delete from `indexedDB`(recursively)
   * - If delete is successful, delete from state
   *
   * If the project is temporary:
   * - Delete from state
   */
  static async deleteItem(path: string) {
    const fullPath = this.convertToFullPath(path);

    // Can't delete src folder
    if (fullPath === this.getCurrentSrcPath()) {
      throw new Error(ItemError.SRC_DELETE);
    }

    if (!this.isTemporary) {
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
      if (path.startsWith(fullPath)) delete files[path];
    }

    // Deleting all elements from a folder results with the parent folder
    // disappearing, add the folder back to mitigate that
    files[PgExplorer.getParentPathFromPath(fullPath)] = {};

    // Change current file to the last tab when current file is deleted
    // or current file's parent is deleted
    if (isCurrentFile || isCurrentParent) this._changeCurrentFileToTheLastTab();

    PgExplorerEvent.dispatchOnDidDeleteItem(fullPath);

    await this.saveMeta();
  }

  /**
   * Create a new workspace and change the current workspace to the created workspace.
   *
   * @param name new workspace name
   * @param opts -
   * - `files`: `TupleFiles` to create the workspace from
   * - `defaultOpenFile`: default file to open in the editor
   * - `fromTemporary`: whether to create new workspace from a temporary project
   * - `skipNameValidation`: whether to skip workspace name validation
   */
  static async newWorkspace(
    name: string,
    opts?: {
      files?: TupleFiles;
      defaultOpenFile?: string;
      fromTemporary?: boolean;
      skipNameValidation?: boolean;
    }
  ) {
    name = name.trim();
    if (!opts?.skipNameValidation && !this.isWorkspaceNameValid(name)) {
      throw new Error(WorkspaceError.INVALID_NAME);
    }

    if (opts?.fromTemporary && this.isTemporary) {
      // The reason we are not just getting the necessary files and re-calling this
      // function with { files } is because we would lose the tab info. Instead we
      // are creating a valid workspace state and writing it to `indexedDB`.

      this._isTemporary = false;
      this._workspace = new PgWorkspace();

      // Init workspace
      await this._initWorkspaces();
      // Create a new workspace in state
      this._workspace.new(name);

      // Change state paths(temporary projects start with /src)
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

    // Create a new workspace in state
    this._workspace.new(name);

    // Create files
    if (opts?.files) {
      for (const [path, content] of opts.files) {
        await this.fs.writeFile(path, content, { createParents: true });
      }

      // Set the default open file
      if (!opts.defaultOpenFile) {
        opts.defaultOpenFile = this._getDefaultOpenFile(opts.files);
      }
    }

    await this.switchWorkspace(name, {
      initial: true,
      defaultOpenFile: opts?.defaultOpenFile,
    });

    PgExplorerEvent.dispatchOnDidCreateWorkspace();
  }

  /**
   * Change the current workspace to the given workspace.
   *
   * @param name workspace name to change to
   * @param opts -
   * - `initial`: if changing to the given workspace for the first time
   * - `defaultOpenFile`: the file to open in the editor
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
      this.changeCurrentFile(
        this.appendToCurrentWorkspacePath(opts.defaultOpenFile)
      );

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
   * Rename the current workspace.
   *
   * @param newName new workspace name
   */
  static async renameWorkspace(newName: string) {
    newName = newName.trim();
    if (!this.isWorkspaceNameValid(newName)) {
      throw new Error(WorkspaceError.INVALID_NAME);
    }
    if (!this._workspace) throw new Error(WorkspaceError.NOT_FOUND);
    if (this.allWorkspaceNames!.includes(newName)) {
      throw new Error(WorkspaceError.ALREADY_EXISTS);
    }

    // Rename workspace folder
    await this.renameItem(this.currentWorkspacePath, newName, {
      skipNameValidation: true,
    });

    // Rename workspace in state
    this._workspace.rename(newName);

    await this.switchWorkspace(newName);

    PgExplorerEvent.dispatchOnDidRenameWorkspace();
  }

  /** Delete the current workspace. */
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
   * Saves file metadata to `indexedDB`
   *
   * NOTE: Only runs when the project is not temporary.
   */
  static async saveMeta(opts?: { initial?: boolean }) {
    if (!this.currentWorkspaceName || !Object.keys(this.files).length) {
      return;
    }

    const metaFile: ItemMetaFile = {};
    if (!opts?.initial) {
      for (const path in this.files) {
        // Check whether all of the files start with the correct path
        if (!path.startsWith(PgExplorer.currentWorkspacePath)) return;

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
   *
   * @param path file path
   * @param content file content
   */
  static saveFileToState(path: string, content: string) {
    path = this.convertToFullPath(path);
    if (this.files[path]) this.files[path].content = content;
  }

  /**
   * Get all files that are in tabs.
   *
   * @returns tab files from state
   */
  static getTabs() {
    const files = this.files;
    const tabs: FullFile[] = [];

    for (const path in files) {
      const meta = files[path].meta;
      if (meta?.tabs) tabs.push({ path, meta });
    }

    return tabs;
  }

  /**
   * Get the full file data.
   *
   * @param path path of the file, defaults to the current file if it exists
   */
  static getFile(path: string): FullFile | null {
    path = this.convertToFullPath(path);
    const itemInfo = this.files[path];
    if (itemInfo) return { path, ...this.files[path] };
    return null;
  }

  /**
   * Get file content from state.
   *
   * @param path file path
   * @returns the file content from state
   */
  static getFileContent(path: string) {
    return this.getFile(this.convertToFullPath(path))?.content;
  }

  /**
   * Get the item names from inside the given folder and group them into
   * `files` and `folders`.
   *
   * @param path folder path
   * @returns the groupped folder items
   */
  static getFolderContent(path: string) {
    path = PgCommon.appendSlash(this.convertToFullPath(path));

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

  /** Get the current opened file from state if it exists. */
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
   * Change the current opened file in state if it exists.
   *
   * @param newPath new file path
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
   * Get the position data for the file from state.
   *
   * @param path file path
   * @returns the file's position data
   */
  static getEditorPosition(path: string): Position {
    return (
      this.getFile(path)?.meta?.position ?? {
        cursor: { from: 0, to: 0 },
        topLineNumber: 1,
      }
    );
  }

  /**
   * Save editor position data to state.
   *
   * @param path file path
   * @param position position data
   */
  static saveEditorPosition(path: string, position: Position) {
    path = this.convertToFullPath(path);

    this.files[path].meta ??= {};
    this.files[path].meta!.position = position;
  }

  /**
   * Close the tab and change the current file to the last opened tab.
   *
   * @param path file path
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
    return PgCommon.joinPaths([this.currentWorkspacePath, path]);
  }

  /**
   * Get the current file's language from it's path.
   *
   * @returns the current language name
   */
  static getCurrentFileLanguage() {
    const currentPath = this.getCurrentFile()?.path;
    if (!currentPath) return null;
    return this.getLanguageFromPath(currentPath);
  }

  /**
   * Get whether current file is a regular JS/TS or test JS/TS file.
   *
   * @returns whether the current file is a JavaScript-like file
   */
  static isCurrentFileJsLike() {
    const currentPath = this.getCurrentFile()?.path;
    if (currentPath) return this.isFileJsLike(currentPath);
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
   * Get the path without the workspace path prefix.
   *
   * @param fullPath full path
   * @returns the relative path
   */
  static getRelativePath(fullPath: string) {
    // /src/lib.rs -> src/lib.rs
    if (PgExplorer.isTemporary) return fullPath.substring(1);

    // /name/src/lib.rs -> src/lib.rs
    return fullPath.replace(PgExplorer.currentWorkspacePath, "");
  }

  // TODO: Path module
  /**
   * Convert the given path to a full path.
   *
   * @param path path to convert
   * @returns the full path
   */
  static convertToFullPath(path: string) {
    // Return absolute path
    if (path.startsWith(this.PATHS.ROOT_DIR_PATH)) return path;

    // Convert to absolute path if it doesn't start with '/'
    return PgCommon.joinPaths([this.getProjectRootPath(), path]);
  }

  /**
   * Get the project root path.
   *
   * This is not to be confused with root path(`/`).
   *
   * @returns the project root path
   */
  static getProjectRootPath() {
    return this.isTemporary
      ? this.PATHS.ROOT_DIR_PATH
      : this.currentWorkspacePath;
  }

  /**
   * Get the current `src` directory path.
   *
   * @returns the current `src` directory path with `/` appended
   */
  static getCurrentSrcPath() {
    const srcPath = PgCommon.joinPaths([
      this.getProjectRootPath(),
      this.PATHS.SRC_DIRNAME,
    ]);
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
      PgExplorer.onDidInit,
      PgExplorer.onDidSwitchFile,
      PgExplorer.onDidCreateItem,
      PgExplorer.onDidDeleteItem,
      PgExplorer.onDidCloseTab,
    ]);
  }

  /**
   * Runs after explorer has been initialized.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidInit(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_INIT,
    });
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
  static onDidRenameItem(cb: (path: string) => unknown) {
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
  static onDidDeleteItem(cb: (path: string) => unknown) {
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

      const subItemPaths = itemNames
        .filter((itemName) => !itemName.includes(PgWorkspace.WORKSPACE_PATH))
        .map((itemName) => {
          return (
            PgCommon.joinPaths([path, itemName]) +
            (PgExplorer.getItemTypeFromName(itemName).folder ? "/" : "")
          );
        });
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

        const lsExplorer: Explorer = JSON.parse(lsExplorerStr);
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
      const file = this.files[this.appendToCurrentWorkspacePath(path)];
      if (file?.content !== undefined) file.meta = metaFile[path];
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
   * Change current file to the last opened tab if it exists
   */
  private static _changeCurrentFileToTheLastTab() {
    const tabs = this.getTabs();
    if (!tabs.length) return;

    const lastTabPath = tabs[tabs.length - 1].path;
    this.changeCurrentFile(lastTabPath);
  }

  /**
   * Get the default open file from the given tuple files.
   *
   * @param files tuple or explorer files
   * @returns the default open file path
   */
  private static _getDefaultOpenFile(files: TupleFiles | ExplorerFiles) {
    if (!Array.isArray(files)) files = this.convertToTupleFiles(files);

    let defaultOpenFile: string | undefined;
    const libRsFile = files.find(([path]) => path.endsWith("lib.rs"));
    if (libRsFile) {
      defaultOpenFile = libRsFile[0];
    } else if (files.length) {
      defaultOpenFile = files[0][0];
    }

    return defaultOpenFile;
  }

  /**
   * Add default open file if the given files don't have file that is `current`.
   *
   * @param files explorer files
   * @returns the explorer files
   */
  private static _addCurrentFileIfNeeded(files: ExplorerFiles) {
    let hasCurrent = false;
    for (const path in files) {
      const current = files[path].meta?.current;
      if (current) hasCurrent = true;
    }

    if (!hasCurrent) {
      const currentPath = this._getDefaultOpenFile(files);
      if (currentPath) files[currentPath].meta = { tabs: true, current: true };
    }

    return files;
  }

  /* --------------------------- Utilities --------------------------- */

  /** Paths */
  static readonly PATHS = {
    ROOT_DIR_PATH: "/",
    SRC_DIRNAME: "src",
    CLIENT_DIRNAME: "client",
    TESTS_DIRNAME: "tests",
  };

  /**
   * Get item's name from its path.
   *
   * @param path item path
   * @returns the item name
   */
  static getItemNameFromPath(path: string) {
    const items = path.split("/");
    const name = path.endsWith("/") ? items.at(-2) : items.at(-1);
    return name!;
  }

  // TODO: Implement a better identifier
  /**
   * Get the item's type from its name.
   *
   * @param itemName item name
   * @returns the item type
   */
  static getItemTypeFromName(itemName: string) {
    if (itemName.includes(".")) return { file: true };
    return { folder: true };
  }

  /**
   * Get the item's type from its path.
   *
   * @param path item path
   * @returns the item type
   */
  static getItemTypeFromPath(path: string) {
    return PgExplorer.getItemTypeFromName(PgExplorer.getItemNameFromPath(path));
  }

  /**
   * Get the item's type from the given element.
   *
   * @param el item element
   * @returns the item type
   */
  static getItemTypeFromEl(el: HTMLDivElement) {
    if (el.classList.contains(ClassName.FOLDER)) {
      return { folder: true };
    } else if (el.classList.contains(ClassName.FILE)) {
      return { file: true };
    }

    return null;
  }

  /**
   * Get the item's path from the given element.
   *
   * @param el item element
   * @returns the item path
   */
  static getItemPathFromEl(el: HTMLDivElement) {
    return el?.getAttribute("data-path");
  }

  /**
   * Get file extension of the given path.
   *
   * @param path file path
   * @returns the file extension
   */
  static getExtensionFromPath(path: string) {
    return path
      .split(".")
      .reverse()
      .filter((cur, i) => i === 0 || (i === 1 && cur === "test"))
      .reverse()
      .join(".");
  }

  /**
   * Get the langugage from the given path's extension.
   *
   * @param path item path
   * @returns the language
   */
  static getLanguageFromPath(path: string) {
    switch (PgExplorer.getExtensionFromPath(path)) {
      case "rs":
        return Lang.RUST;
      case "py":
        return Lang.PYTHON;
      case "js":
        return Lang.JAVASCRIPT;
      case "ts":
        return Lang.TYPESCRIPT;
      case "test.js":
        return Lang.JAVASCRIPT_TEST;
      case "test.ts":
        return Lang.TYPESCRIPT_TEST;
      case "json":
        return Lang.JSON;
      default:
        return null;
    }
  }

  /**
   * Get whether the given path is a regular JS/TS or test JS/TS file.
   *
   * @path file path
   * @returns whether the given file is a JavaScript-like file
   */
  static isFileJsLike(path: string) {
    switch (PgExplorer.getLanguageFromPath(path)) {
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
   * Get whether the element is a JS/TS client element.
   *
   * @param el item element
   * @returns whether the element can run client
   */
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

  /**
   * Get whether the element is a JS/TS test element.
   *
   * @param el item element
   * @returns whether the element can run tests
   */
  static getIsItemTestFromEl(el: HTMLDivElement) {
    const path = this.getItemPathFromEl(el);
    if (!path) return false;
    const lang = this.getLanguageFromPath(path);
    return (
      !!path && (lang === Lang.JAVASCRIPT_TEST || lang === Lang.TYPESCRIPT_TEST)
    );
  }

  /**
   * Get the parent's path from the given path with `/` appended.
   *
   * @param path item path
   * @returns the parent path
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

    return PgCommon.appendSlash(parentPath);
  }

  /**
   * Get the parent path from the given element.
   *
   * @param el item element
   * @returns the parent path
   */
  static getParentPathFromEl = (el: HTMLDivElement) => {
    const itemType = this.getItemTypeFromEl(el);

    if (itemType?.folder) {
      return el?.getAttribute("data-path");
    } else if (itemType?.file) {
      // The file's owner folder is parent element's previous sibling
      return el.parentElement!.previousElementSibling!.getAttribute(
        "data-path"
      );
    }

    return null;
  };

  /**
   * Get the eleemnt from its path.
   *
   * @param path item path
   * @returns the element
   */
  static getElFromPath(path: string) {
    return document.querySelector(`[data-path='${path}']`) as HTMLDivElement;
  }

  /** Get the root folder elemement. */
  static getRootFolderEl() {
    return document.getElementById(Id.ROOT_DIR);
  }

  /** Get the current selected element. */
  static getSelectedEl = () => {
    return document.getElementsByClassName(ClassName.SELECTED)[0] as
      | HTMLDivElement
      | undefined;
  };

  /**
   * Set the current selected element.
   *
   * @param newEl new element to select
   */
  static setSelectedEl = (newEl: HTMLDivElement) => {
    const selectedEl = this.getSelectedEl();
    selectedEl?.classList.remove(ClassName.SELECTED);
    newEl.classList.add(ClassName.SELECTED);
  };

  /** Get the selected context element. */
  static getCtxSelectedEl() {
    const ctxSelectedEls = document.getElementsByClassName(
      ClassName.CTX_SELECTED
    );
    if (ctxSelectedEls.length) return ctxSelectedEls[0];
  }

  /** Set the selected context element. */
  static setCtxSelectedEl = (newEl: HTMLDivElement) => {
    this.removeCtxSelectedEl();
    newEl.classList.add(ClassName.CTX_SELECTED);
  };

  /** Remove the selected context element. */
  static removeCtxSelectedEl() {
    PgExplorer.getCtxSelectedEl()?.classList.remove(ClassName.CTX_SELECTED);
  }

  /**
   * Open the given folder element.
   *
   * @param el folder element
   */
  static openFolder(el: HTMLDivElement) {
    // Folder icon
    el.classList.add(ClassName.OPEN);

    // Toggle inside folder
    const insideFolderEl = el.nextElementSibling;
    if (insideFolderEl) insideFolderEl.classList.remove(ClassName.HIDDEN);
  }

  /**
   * Toggle open/close state of the given folder element.
   *
   * @param el folder element
   */
  static toggleFolder(el: HTMLDivElement) {
    // Folder icon
    el.classList.toggle(ClassName.OPEN);

    // Toggle inside folder
    const insideFolderEl = el.nextElementSibling;
    if (insideFolderEl) insideFolderEl.classList.toggle(ClassName.HIDDEN);
  }

  /**
   * Recursively open all parent folders of the given path.
   *
   * @param path item path
   */
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

  /** Collapse all folders in the UI. */
  static collapseAllFolders() {
    const rootEl = this.getRootFolderEl();
    if (!rootEl) return;

    // Remove selected
    this.getSelectedEl()?.classList.remove(ClassName.SELECTED);

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

  /**
   * Get whether the given name can be used for an item.
   *
   * @param name item name
   * @returns whether the item name is valid
   */
  static isItemNameValid(name: string) {
    return (
      !!name.match(/^(?![./])[\w.-/]+/) &&
      !name.includes("//") &&
      !name.includes("..") &&
      !name.endsWith("/") &&
      !name.endsWith(".")
    );
  }

  /**
   * Get whether the given name can be used for a workspace.
   *
   * @param name item name
   * @returns whether the workspace name is valid
   */
  static isWorkspaceNameValid(name: string) {
    return !!name.match(/^(?!\s)[\w\s-]+$/);
  }

  /**
   * Get all files as `TupleFiles`
   *
   * @returns all files as an array of [path, content] tuples
   */
  static getAllFiles() {
    return this.convertToTupleFiles(this.files);
  }

  /**
   * Convert the given `ExplorerFiles` to `TupleFiles`
   *
   * @returns all files as an array of [path, content] tuples
   */
  static convertToTupleFiles(explorerFiles: ExplorerFiles) {
    const tupleFiles: TupleFiles = [];
    for (const path in explorerFiles) {
      const content = explorerFiles[path].content;
      if (content !== undefined) tupleFiles.push([path, content]);
    }

    return tupleFiles;
  }

  /**
   * Convert the given `TupleFiles` to `ExplorerFiles`.
   *
   * @param tupleFiles tuple files to convert
   * @returns the converted `ExplorerFiles`
   */
  static convertToExplorerFiles(tupleFiles: TupleFiles) {
    const explorerFiles: ExplorerFiles = {};

    for (const [path, content] of tupleFiles) {
      const fullPath = PgCommon.joinPaths([
        PgExplorer.PATHS.ROOT_DIR_PATH,
        path,
      ]);
      explorerFiles[fullPath] = { content };
    }

    return explorerFiles;
  }
}
