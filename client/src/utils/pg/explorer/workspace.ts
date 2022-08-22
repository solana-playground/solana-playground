import { WorkspaceError } from "../../../constants";

export interface Workspaces {
  currentName: string;
  allNames: string[];
}

/**
 * Workspace functionality class that only exists in the memory state
 *
 * This class does not have access to IndexedDB
 */
export class PgWorkspace {
  /** Class methods */
  private _currentName: string;
  private _allNames: string[];

  constructor(params: Workspaces = PgWorkspace.default()) {
    this._currentName = params.currentName;
    this._allNames = params.allNames;
  }

  /** Get current workspace name */
  get currentName() {
    return this._currentName;
  }

  /** Get all workspace names */
  get allNames() {
    return this._allNames;
  }

  /**
   * @returns workspaces state
   */
  get(): Workspaces {
    return {
      currentName: this.currentName,
      allNames: this.allNames,
    };
  }

  /**
   * Set the current workspaces
   * @param workspaces new workspaces config to set the state to
   */
  setCurrent(workspaces: Workspaces) {
    this._currentName = workspaces.currentName;
    this._allNames = workspaces.allNames;
  }

  /**
   * Set the current workspace name
   * @param name new workspace name to set the current name to
   */
  setCurrentName(name: string) {
    if (this._allNames.includes(name)) {
      this._currentName = name;
    }
  }

  /**
   * Create a new workspace in state
   * @param name workspace name
   */
  new(name: string) {
    if (this._allNames.includes(name)) {
      throw new Error(WorkspaceError.ALREADY_EXISTS);
    }

    this._allNames.push(name);
    this._currentName = name;
  }

  /**
   * Delete the given workspace in state
   * @param name workspace name
   */
  delete(name: string) {
    this._allNames = this._allNames.filter((n) => n !== name);
  }

  /**
   * Rename the given workspace
   * @param oldName current workspace name
   * @param newName new workspace name
   */
  rename(oldName: string, newName: string) {
    if (this._allNames.includes(newName)) {
      throw new Error(WorkspaceError.ALREADY_EXISTS);
    }

    this._allNames = this._allNames.map((n) => (n === oldName ? newName : n));

    if (oldName === this._currentName) {
      this._currentName = newName;
    }
  }

  /** Static methods */

  /** Path to the file that has data about all the workspaces */
  static readonly WORKSPACES_CONFIG_PATH = "/.config/workspaces.json";
  static readonly TABINFO_PATH = ".workspace/tabs.json";

  static readonly DEFAULT_WORKSPACE_NAME = "default";

  /**
   * @returns default workspaces
   */
  static default(): Workspaces {
    return {
      currentName: this.DEFAULT_WORKSPACE_NAME,
      allNames: [this.DEFAULT_WORKSPACE_NAME],
    };
  }
}
