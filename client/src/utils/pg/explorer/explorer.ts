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

export class PgExplorer {
  /** Internal state */
  private static _explorer = this._getDefaultState();
  /** Whether the explorer is initialized */
  private static _isInitialized = false;
  /** Whether the current explorer state is temporary */
  private static _isTemporary: boolean;
  /** Workspace functionality */
  private static _workspace: PgWorkspace | null = null;
  /** Current initialized workspace name */
  private static _initializedWorkspaceName: string | null = null;

  /** `indexedDB` file system */
  static fs = PgFs;

  /* -------------------------------- Getters ------------------------------- */

  /** Get whether the explorer is initialized */
  static get isInitialized() {
    return this._isInitialized;
  }

  /** Get whether the current workspace is temporary */
  static get isTemporary() {
    return this._isTemporary;
  }

  /** Get explorer files */
  static get files() {
    return this._explorer.files;
  }

  /** Get explorer tabs */
  static get tabs() {
    return this._explorer.tabs as Readonly<Explorer["tabs"]>;
  }

  /** Get current file path */
  static get currentFilePath() {
    return this.tabs.at(this._currentIndex);
  }

  /** Get current file path index */
  private static get _currentIndex() {
    return this._explorer.currentIndex;
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

    return PgCommon.joinPaths(
      PgExplorer.PATHS.ROOT_DIR_PATH,
      PgCommon.appendSlash(this.currentWorkspaceName)
    );
  }

  /** Get current workspace name */
  static get currentWorkspaceName() {
    return this._workspace?.currentName;
  }

  /** Get names of all workspaces */
  static get allWorkspaceNames() {
    return this._workspace?.allNames;
  }

  /* ---------------------------- Public methods ---------------------------- */

  /**
   * Initialize explorer.
   *
   * @param params -
   * - `files`: Files to initialize the explorer from
   * - `name`: Initialize the given workspace name
   */
  static async init(params?: {
    files?: ExplorerFiles | TupleFiles;
    name?: string;
  }) {
    if (params?.files) {
      this._isTemporary = true;
      this._workspace = null;

      // Reset the explorer state
      this._explorer = this._getDefaultState();

      // Files
      this._explorer.files = Array.isArray(params.files)
        ? this._convertToExplorerFiles(params.files)
        : params.files;

      // Tabs, current
      const currentFilePath = this._getDefaultOpenFile(this._explorer.files);
      if (currentFilePath) this.openFile(currentFilePath);
    }
    // Skip initializing if the workspace has already been initialized
    else if (
      this._initializedWorkspaceName ===
      (params?.name ?? this.currentWorkspaceName)
    ) {
    } else {
      this._isTemporary = false;
      if (!this._workspace) await this._initWorkspaces();

      // Check whether the workspace exists
      const workspaceName = params?.name ?? this.currentWorkspaceName;
      if (workspaceName && this.allWorkspaceNames!.includes(workspaceName)) {
        await this.switchWorkspace(workspaceName);
      }
      // Reset files if there are no workspaces
      else if (this.allWorkspaceNames!.length === 0) {
        // Reset the explorer state
        this._explorer = this._getDefaultState();
      }
    }

    this._isInitialized = true;

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

      if (!opts?.openOptions || opts?.openOptions?.onlyRefreshIfAlreadyOpen) {
        const isCurrentFile = this.currentFilePath === fullPath;

        // Close the file if we are overriding to correctly display the new content
        if (opts?.override && isCurrentFile) this.closeFile(fullPath);

        // Open if it's the current file or there is no open options
        if (!opts?.openOptions || isCurrentFile) this.openFile(fullPath);
      }
    }
    // Folder
    else {
      if (!this.isTemporary) await this.fs.createDir(fullPath);

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
    oldPath: string,
    newPath: string,
    opts?: { skipNameValidation?: boolean; override?: boolean }
  ) {
    oldPath = this.convertToFullPath(oldPath);
    newPath = this.convertToFullPath(newPath);

    // Return if there is no change
    if (PgCommon.isPathsEqual(newPath, oldPath)) return;

    if (!opts?.skipNameValidation && !PgExplorer.isItemNameValid(newPath)) {
      throw new Error(ItemError.INVALID_NAME);
    }
    if (PgCommon.isPathsEqual(oldPath, this.getCurrentSrcPath())) {
      throw new Error(ItemError.SRC_RENAME);
    }

    const itemType = PgExplorer.getItemTypeFromPath(oldPath);
    const newItemType = PgExplorer.getItemTypeFromPath(newPath);
    if (
      (itemType.file && !newItemType.file) ||
      (itemType.folder && !newItemType.folder)
    ) {
      throw new Error(ItemError.TYPE_MISMATCH);
    }

    if (!opts?.override) {
      // Check whether `newPath` exists because `fs.rename` doesn't throw when
      // `newPath` exists
      let newPathExists: boolean;
      if (itemType.file) {
        newPathExists = !!this.getFile(newPath);
      } else {
        const { files, folders } = this.getFolderContent(newPath);
        newPathExists = files.length > 0 || folders.length > 0;
      }
      if (newPathExists) throw new Error(ItemError.ALREADY_EXISTS);
    }

    // Rename in `indexedDB`
    if (!this.isTemporary) await this.fs.rename(oldPath, newPath);

    // Rename in state
    const files = this.files;
    const rename = (oldPath: string, newPath: string) => {
      // Store the item
      const item = files[oldPath];

      // Delete the old item
      delete files[oldPath];

      // Set the new path
      files[newPath] = item;

      // Handle tabs if it's a file
      if (PgExplorer.getItemTypeFromPath(newPath).file) {
        // Rename tabs manually instead of closing the old file and opening the
        // new file in order to keep the tab order
        const tabIndex = this.tabs.indexOf(oldPath);
        if (tabIndex !== -1) this._explorer.tabs[tabIndex] = newPath;
      }
    };

    // Rename in state
    if (itemType.file) {
      rename(oldPath, newPath);

      // Moving all elements from a folder results with the parent folder
      // disappearing, add the folder back to mitigate
      files[PgExplorer.getParentPathFromPath(oldPath)] = {};
    } else {
      // We need to loop through all files in order to change every child path
      for (const path in files) {
        // /programs/my_program/logs/logfile.log
        // If we are renaming 'my_program' then we can replace '/programs/my_program/'
        // with '/programs/<new_name>/'
        if (path.startsWith(oldPath)) {
          const childPath = path.replace(
            oldPath,
            oldPath.endsWith("/") ? PgCommon.appendSlash(newPath) : newPath
          );
          rename(path, childPath);
        }
      }
    }

    // Set tabs to close the duplicate paths
    if (opts?.override) this.setTabs(this.tabs);

    // Keep the same current file after rename
    PgExplorerEvent.dispatchOnDidOpenFile(this.getCurrentFile()!);
    PgExplorerEvent.dispatchOnDidRenameItem(oldPath);

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
    if (PgCommon.isPathsEqual(fullPath, this.getCurrentSrcPath())) {
      throw new Error(ItemError.SRC_DELETE);
    }

    if (!this.isTemporary) {
      const metadata = await this.fs.getMetadata(fullPath);
      if (metadata.isFile()) await this.fs.removeFile(fullPath);
      else await this.fs.removeDir(fullPath, { recursive: true });
    }

    // If we are deleting current file's parent(s), we need to set the current
    // file to the last tab
    const isCurrentFile = this.currentFilePath === fullPath;
    const isCurrentParent = this.currentFilePath?.startsWith(fullPath);

    for (const path in this.files) {
      if (path.startsWith(fullPath)) {
        delete this.files[path];
        this.closeFile(path);
      }
    }

    // Deleting all elements from a folder results with the parent folder
    // disappearing, add the folder back to mitigate
    this.files[PgExplorer.getParentPathFromPath(fullPath)] = {};

    // Change the current file to the closest tab when current file or its
    // parent is deleted
    if (isCurrentFile || isCurrentParent) {
      const lastTabPath = this.tabs.at(-1);
      if (lastTabPath) this.openFile(lastTabPath);
    }

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

      // Init workspace
      await this._initWorkspaces();
      // Create a new workspace in state
      this._workspace!.new(name);

      // It's important to set `_isTemporary` after the workspace is created,
      // otherwise there is a chance the creation fails, and the state ends up
      // being invalid.
      // See https://github.com/solana-playground/solana-playground/issues/275
      this._isTemporary = false;

      // Change state paths(temporary projects start with /src)
      const getFullPath = (path: string) => {
        return PgCommon.joinPaths(PgExplorer.PATHS.ROOT_DIR_PATH, name, path);
      };
      for (const path in this.files) {
        const data = this.files[path];
        delete this.files[path];
        this.files[getFullPath(path)] = data;
      }
      this.setTabs(this.tabs.map(getFullPath));

      // Save files from state to `indexedDB`
      await this._writeAllFromState();

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
      opts.defaultOpenFile ??= this._getDefaultOpenFile(opts.files);
    }

    await this.switchWorkspace(name, {
      defaultOpenFile: opts?.defaultOpenFile,
    });

    PgExplorerEvent.dispatchOnDidCreateWorkspace();
  }

  /**
   * Change the current workspace to the given workspace.
   *
   * @param name workspace name to change to
   * @param opts -
   * - `defaultOpenFile`: the file to open in the editor
   */
  static async switchWorkspace(
    name: string,
    opts?: { defaultOpenFile?: string }
  ) {
    // Save metadata before changing the workspace to never lose data
    await this.saveMeta();

    // Set the workspace
    this.setWorkspaceName(name);
    await this._saveWorkspaces();

    // Initialize the workspace
    await this._initCurrentWorkspace();

    // Open the default file if it has been specified
    if (opts?.defaultOpenFile) {
      this.openFile(opts.defaultOpenFile);

      // Save metadata to never lose default open file
      await this.saveMeta();
    } else {
      PgExplorerEvent.dispatchOnDidOpenFile(this.getCurrentFile()!);
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
    if (!this._workspace) {
      throw new Error(WorkspaceError.NOT_FOUND);
    }
    if (!this.currentWorkspaceName) {
      throw new Error(WorkspaceError.CURRENT_NOT_FOUND);
    }
    if (!this.isWorkspaceNameValid(newName)) {
      throw new Error(WorkspaceError.INVALID_NAME);
    }
    if (this.allWorkspaceNames!.includes(newName)) {
      throw new Error(WorkspaceError.ALREADY_EXISTS);
    }

    // Rename workspace folder
    const newPath = this.currentWorkspacePath.replace(
      this.currentWorkspaceName,
      newName
    );
    await this.renameItem(this.currentWorkspacePath, newPath, {
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

    // Delete from `indexedDB`
    await this.deleteItem(this.currentWorkspacePath);

    // Delete from state
    this._workspace.delete(this.currentWorkspaceName);

    const workspaceCount = this._workspace.allNames.length;
    if (workspaceCount) {
      const lastWorkspace = this._workspace.allNames[workspaceCount - 1];
      await this.switchWorkspace(lastWorkspace);
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
  static async saveMeta() {
    const paths = Object.keys(this.files);
    if (!this.currentWorkspaceName || !paths.length) return;

    // Check whether the files start with the correct workspace path
    const isInvalidState = paths.some(
      (path) => !path.startsWith(this.currentWorkspacePath)
    );
    if (isInvalidState) return;

    const metaFile = paths
      .reduce((acc, path) => {
        // Only save the files in the current workspace
        if (path.startsWith(this.currentWorkspacePath)) {
          acc.push({
            path,
            isTabs: this.tabs.includes(path),
            isCurrent: this.currentFilePath === path,
            position: this.files[path].meta?.position,
          });
        }

        return acc;
      }, [] as ItemMetaFile)
      .sort((a, b) => {
        // Sort based on tab order
        if (!a.isTabs) return 1;
        if (!b.isTabs) return -1;
        return this.tabs.indexOf(a.path) - this.tabs.indexOf(b.path);
      })
      .map((meta) => ({ ...meta, path: this.getRelativePath(meta.path) }));

    // Save file
    await this.fs.writeFile(
      PgWorkspace.METADATA_PATH,
      JSON.stringify(metaFile),
      { createParents: true }
    );
  }

  /* ----------------------------- State methods ---------------------------- */

  /**
   * Get all files as `TupleFiles`
   *
   * @returns all files as an array of [path, content] tuples
   */
  static getAllFiles() {
    return this._convertToTupleFiles(this.files);
  }

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
    return this.getFile(path)?.content;
  }

  /**
   * Get the item names from inside the given folder and group them into
   * `files` and `folders`.
   *
   * @param path folder path
   * @returns the groupped folder items
   */
  static getFolderContent(path: string) {
    path = PgCommon.appendSlash(PgExplorer.convertToFullPath(path));

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
   * Get the current open file from state if it exists.
   *
   * @returns the current file
   */
  static getCurrentFile() {
    if (this.currentFilePath) return this.getFile(this.currentFilePath);
    return null;
  }

  /**
   * Get the current file's language from it's path.
   *
   * @returns the current language name
   */
  static getCurrentFileLanguage() {
    if (this.currentFilePath) {
      return this.getLanguageFromPath(this.currentFilePath);
    }
  }

  /**
   * Get whether current file is a regular JS/TS or test JS/TS file.
   *
   * @returns whether the current file is a JavaScript-like file
   */
  static isCurrentFileJsLike() {
    if (this.currentFilePath) return this.isFileJsLike(this.currentFilePath);
  }

  /**
   * Open the file at the given path.
   *
   * This method mutates the existing tabs array.
   *
   * @param path file path
   */
  static openFile(path: string) {
    path = this.convertToFullPath(path);

    // Return if it's already the current file
    if (this.currentFilePath === path) return;

    // Add to tabs if it hasn't yet been added
    if (!this.tabs.includes(path)) this._explorer.tabs.push(path);

    // Update the current file index
    this._explorer.currentIndex = this.tabs.indexOf(path);

    PgExplorerEvent.dispatchOnDidOpenFile(this.getCurrentFile()!);
  }

  /**
   * Close the file at the given path.

   * This method mutates the existing tabs array.
   *
   * @param path file path
   */
  static closeFile(path: string) {
    path = this.convertToFullPath(path);

    // If closing the current file, change the current file to the next tab
    if (this.currentFilePath === path) {
      const pathToOpen =
        this.tabs.at(this._currentIndex + 1) ?? this.tabs.at(-2);
      if (pathToOpen) this.openFile(pathToOpen);
    }

    // Update tabs and the current index
    if (this.currentFilePath) {
      this._explorer.tabs.splice(this.tabs.indexOf(path), 1);
      this._explorer.currentIndex = this.tabs.indexOf(this.currentFilePath);
    }

    PgExplorerEvent.dispatchOnDidCloseFile();
  }

  /**
   * Set the tab paths without duplication.
   *
   * @param tabs tab paths to set
   */
  static setTabs(tabs: readonly string[]) {
    const currentPath = this.currentFilePath;
    this._explorer.tabs = [...new Set(tabs)];
    if (currentPath) {
      this._explorer.currentIndex = this.tabs.indexOf(currentPath);
    }

    PgExplorerEvent.dispatchOnDidSetTabs();
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

  /**
   * Get the canonical path, i.e. the full path from the project root and
   * directory paths end with `/`.
   *
   * @param path item path
   * @returns the canonical path
   */
  static getCanonicalPath(path: string) {
    path = PgExplorer.convertToFullPath(path);
    if (PgExplorer.getItemTypeFromPath(path).file) return path;
    return PgCommon.appendSlash(path);
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
    return PgCommon.joinPaths(this.getProjectRootPath(), path);
  }

  /**
   * Get the current project root path.
   *
   * This is not to be confused with root path(`/`).
   *
   * @returns the current project root path
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
    const srcPath = PgCommon.joinPaths(
      this.getProjectRootPath(),
      this.PATHS.SRC_DIRNAME
    );
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
      PgExplorer.onDidCreateItem,
      PgExplorer.onDidDeleteItem,
      PgExplorer.onDidOpenFile,
      PgExplorer.onDidCloseFile,
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
  static onDidOpenFile(cb: (file: FullFile | null) => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_OPEN_FILE,
      initialRun: { value: PgExplorer.getCurrentFile() },
    });
  }

  /**
   * Runs after closing a file.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidCloseFile(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_CLOSE_FILE,
    });
  }

  /**
   * Runs after setting tabs.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidSetTabs(cb: () => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgExplorerEvent.ON_DID_SET_TABS,
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

  /* ---------------------------- Private methods --------------------------- */

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

      // Empty directory
      if (!itemNames.length) {
        this.files[path] = {};
        return;
      }

      const subItemPaths = itemNames
        .filter(PgExplorer.isItemNameValid)
        .map((itemName) => {
          return PgExplorer.getCanonicalPath(
            PgCommon.joinPaths(path, itemName)
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

      // The most likely cause for `setupFiles` failure is if the current
      // workspace doesn't exist in the filesystem but it's saved as the
      // current workspace. To fix this, set the current workspace name to
      // either the last workspace, or reset all workspaces in the case of no
      // valid workspace directory in `/`.
      if (this._workspace.allNames.length) {
        const rootDirs = await this.fs.readDir(PgExplorer.PATHS.ROOT_DIR_PATH);
        const workspaceDirs = rootDirs.filter(PgExplorer.isItemNameValid);
        if (!workspaceDirs.length) {
          // Reset workspaces since there is no workspace directories
          this._workspace = new PgWorkspace();
        } else {
          // Open the last workspace
          const lastWorkspaceName = workspaceDirs[workspaceDirs.length - 1];
          this._workspace.rename(lastWorkspaceName);
        }

        await this._saveWorkspaces();
        await this._initCurrentWorkspace();

        return;
      }

      console.log("No workspace found. Most likely needs initial setup.");
    }

    // Runs when `indexedDB` is empty
    if (!Object.keys(this.files).length && !this.allWorkspaceNames?.length) {
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
    let metaFile = await this.fs.readToJSONOrDefault<ItemMetaFile>(
      PgWorkspace.METADATA_PATH,
      []
    );

    // Convert the old metadata file
    // TODO: Delete in 2024
    if (!Array.isArray(metaFile)) {
      type OldItemMetaFile = Record<
        string,
        {
          current?: boolean;
          tabs?: boolean;
          position?: Position;
        }
      >;

      const oldMetaFile = metaFile as OldItemMetaFile;
      metaFile = [];
      for (const path in oldMetaFile) {
        const meta = oldMetaFile[path];
        metaFile.push({
          path,
          isTabs: meta.tabs,
          isCurrent: meta.current,
          position: meta.position,
        });
      }
    }

    // Metadata file paths are relative, convert to full path
    const fullPathMetaFile = metaFile.map((meta) => ({
      ...meta,
      path: this.convertToFullPath(meta.path),
    }));

    // Tabs
    const tabs = fullPathMetaFile
      .filter((meta) => meta.isTabs)
      .map((meta) => meta.path);
    this.setTabs(tabs);

    // Current
    const current = fullPathMetaFile.find((meta) => meta.isCurrent);
    this._explorer.currentIndex = current
      ? this.tabs.indexOf(current.path)
      : -1;

    // Metadata
    for (const itemMeta of fullPathMetaFile) {
      const file = this.files[itemMeta.path];
      if (file?.content !== undefined) {
        file.meta = { position: itemMeta.position };
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
    const workspaces = await this._getWorkspaces();
    this._workspace ??= new PgWorkspace();
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
   * Get the default explorer state.
   *
   * NOTE: This is intentionally a method instead of a property in order to create a
   * new object each time since explorer methods mutate the existing object.
   *
   * @returns the default explorer state
   */
  private static _getDefaultState(): Explorer {
    return {
      files: {},
      tabs: [],
      currentIndex: -1,
    };
  }

  /* ------------------------------- Utilities ------------------------------ */

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
    const path = PgExplorer.getItemPathFromEl(el);
    if (path) return PgExplorer.getItemTypeFromPath(path);
  }

  /**
   * Get the item's path from the given element.
   *
   * @param el item element
   * @returns the item path
   */
  static getItemPathFromEl(el: Element) {
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
  static getParentPathFromEl(el: HTMLDivElement) {
    const itemType = PgExplorer.getItemTypeFromEl(el);

    if (itemType?.folder) {
      return PgExplorer.getItemPathFromEl(el);
    } else if (itemType?.file) {
      // The file's owner folder is parent element's previous sibling
      return PgExplorer.getItemPathFromEl(
        el.parentElement!.previousElementSibling as HTMLDivElement
      );
    }
  }

  /**
   * Get the eleemnt from its path.
   *
   * @param path item path
   * @returns the element
   */
  static getElFromPath(path: string) {
    return document.querySelector(`[data-path='${path}']`) as
      | HTMLDivElement
      | undefined;
  }

  /** Get the root folder elemement. */
  static getRootFolderEl() {
    return document.getElementById(Id.ROOT_DIR);
  }

  /** Get the current selected element. */
  static getSelectedEl() {
    return document.getElementsByClassName(ClassName.SELECTED)[0] as
      | HTMLDivElement
      | undefined;
  }

  /**
   * Set the current selected element.
   *
   * @param newEl new element to select
   */
  static setSelectedEl(newEl: HTMLDivElement) {
    PgExplorer.getSelectedEl()?.classList.remove(ClassName.SELECTED);
    newEl.classList.add(ClassName.SELECTED);
  }

  /** Get the selected context element. */
  static getCtxSelectedEl() {
    const ctxSelectedEls = document.getElementsByClassName(
      ClassName.CTX_SELECTED
    );
    if (ctxSelectedEls.length) return ctxSelectedEls[0];
  }

  /** Set the selected context element. */
  static setCtxSelectedEl(newEl: HTMLDivElement) {
    PgExplorer.removeCtxSelectedEl();
    newEl.classList.add(ClassName.CTX_SELECTED);
  }

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
      if (parentPath === this.PATHS.ROOT_DIR_PATH) break;

      path = parentPath;
    }
  }

  /** Collapse all folders in the UI. */
  static collapseAllFolders() {
    // Close all folders
    const folderElements = document.getElementsByClassName(ClassName.FOLDER);
    for (const folder of folderElements) {
      folder.classList.remove(ClassName.OPEN);
    }

    // Hide all folder inside elements
    const insideElements = document.getElementsByClassName(
      ClassName.FOLDER_INSIDE
    );
    for (const folderInside of insideElements) {
      folderInside.classList.add(ClassName.HIDDEN);
    }
  }

  /**
   * Get whether the given name can be used for an item.
   *
   * @param name item name
   * @returns whether the item name is valid
   */
  static isItemNameValid(name: string) {
    return (
      /^(?![.])[\w\d.-/]+/.test(name) &&
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

  /* --------------------------- Private utilities -------------------------- */

  /**
   * Convert the given `ExplorerFiles` to `TupleFiles`.
   *
   * @returns all files as an array of [path, content] tuples
   */
  private static _convertToTupleFiles(explorerFiles: ExplorerFiles) {
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
  private static _convertToExplorerFiles(tupleFiles: TupleFiles) {
    const explorerFiles: ExplorerFiles = {};

    for (const [path, content] of tupleFiles) {
      const fullPath = PgCommon.joinPaths(PgExplorer.PATHS.ROOT_DIR_PATH, path);
      explorerFiles[fullPath] = { content };
    }

    return explorerFiles;
  }

  /**
   * Get the default open file from the given tuple files.
   *
   * @param files tuple or explorer files
   * @returns the default open file path
   */
  private static _getDefaultOpenFile(files: TupleFiles | ExplorerFiles) {
    if (!Array.isArray(files)) files = this._convertToTupleFiles(files);

    let defaultOpenFile: string | undefined;
    const libRsFile = files.find(([path]) => path.endsWith("lib.rs"));
    if (libRsFile) {
      defaultOpenFile = libRsFile[0];
    } else if (files.length) {
      defaultOpenFile = files[0][0];
    }

    return defaultOpenFile;
  }
}
