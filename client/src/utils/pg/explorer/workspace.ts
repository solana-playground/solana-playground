import { WorkspaceError } from "../../../constants";
import { PgCommon } from "../common";

interface Workspaces {
  /** All workspace names */
  allNames: string[];
  /** Current workspace name */
  currentName?: string;
}

/**
 * Workspace functionality class that only exists in the memory state
 *
 * This class does not have access to IndexedDB
 */
export class PgWorkspace {
  /** Class methods */
  private _state: Workspaces;

  constructor(workspaces: Workspaces = PgWorkspace.DEFAULT) {
    this._state = workspaces;
  }

  /** Get all workspace names */
  get allNames() {
    return this._state.allNames;
  }

  /** Get current workspace name */
  get currentName() {
    return this._state.currentName;
  }

  /**
   * Get the current workspaces.
   *
   * @returns the current workspaces state
   */
  get(): Workspaces {
    return {
      currentName: this.currentName,
      allNames: this.allNames,
    };
  }

  /**
   * Set the current workspaces.
   *
   * @param workspaces new workspaces config to set the state to
   */
  setCurrent(workspaces: Workspaces) {
    this._state.allNames = workspaces.allNames;
    this._state.currentName = workspaces.currentName;
  }

  /**
   * Set the current workspace name.
   *
   * @param name new workspace name to set the current name to
   */
  setCurrentName(name: string) {
    if (this.allNames.includes(name)) {
      this._state.currentName = name;
    }
  }

  /**
   * Create a new workspace in state and set the current state.
   *
   * @param name workspace name
   */
  new(name: string) {
    if (this.allNames.includes(name)) {
      throw new Error(WorkspaceError.ALREADY_EXISTS);
    }

    this._state.allNames.push(name);
    this._state.currentName = name;
  }

  /**
   * Delete the given workspace in state.
   *
   * @param name workspace name
   */
  delete(name: string) {
    this._state.allNames = this._state.allNames.filter((n) => n !== name);
  }

  /**
   * Rename the given workspace and make it current.
   *
   * @param newName new workspace name
   */
  rename(newName: string) {
    if (this._state.allNames.includes(newName)) {
      throw new Error(WorkspaceError.ALREADY_EXISTS);
    }

    const oldName = this._state.currentName;
    this._state.allNames = this._state.allNames.map((n) =>
      n === oldName ? newName : n
    );

    this._state.currentName = newName;
  }

  /* ---------------------------- Static methods ---------------------------- */

  /** Default workspaces */
  static readonly DEFAULT: Workspaces = {
    allNames: [],
  };

  /** Path to the file that has data about all the workspaces */
  static readonly WORKSPACES_CONFIG_PATH = "/.config/workspaces.json";

  /* ----------------------- Workspace relative paths ----------------------- */

  /** Relative PATH to workspace data */
  static readonly WORKSPACE_PATH = ".workspace";

  /** Relative path to file metadatas */
  static readonly METADATA_PATH = PgCommon.joinPaths(
    this.WORKSPACE_PATH,
    "metadata.json"
  );

  /** Default name to name the projects that used to be in localStorage */
  static readonly DEFAULT_WORKSPACE_NAME = "default";
}
