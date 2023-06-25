import { PgCommon } from "../common";
import { PgExplorer, TupleFiles } from "../explorer";
import { PgRouter } from "../router";
import { PgView, Sidebar } from "../view";
import { declareUpdatable, updatable } from "../decorators";
import type {
  SerializedTutorialState,
  TutorialData,
  TutorialMetadata,
  TutorialState,
} from "./types";

const defaultState: TutorialState = {
  pageNumber: null,
  pageCount: null,
  completed: null,
  view: null,
  data: null,
};

const storage = {
  /** Relative path to program info */
  PATH: ".tutorial.json",

  /** Read from storage and deserialize the data. */
  async read(): Promise<TutorialState> {
    if (!PgTutorial.isStarted(PgTutorial.data?.name)) {
      return { ...defaultState, data: PgTutorial.data };
    }

    let serializedState: SerializedTutorialState;
    try {
      serializedState = await PgExplorer.fs.readToJSON(this.PATH);
    } catch {
      return { ...defaultState, data: PgTutorial.data };
    }

    return { ...defaultState, ...serializedState, data: PgTutorial.data };
  },

  /** Serialize the data and write to storage. */
  async write(state: TutorialState) {
    if (!PgTutorial.isStarted(PgTutorial.data?.name)) return;

    // Don't use spread operator(...) because of the extra state
    const serializedState: SerializedTutorialState = {
      pageNumber: state.pageNumber,
      pageCount: state.pageCount,
      completed: state.completed,
    };

    await PgExplorer.fs.writeFile(this.PATH, JSON.stringify(serializedState));
  },
};

@updatable({ defaultState, storage })
class _PgTutorial {
  /** All tutorials */
  static tutorials: TutorialData[];

  /**
   * Get the tutorial's data from its name.
   *
   * @param name tutorial name
   * @returns the tutorial's data if it exists
   */
  static getTutorialData(name: string) {
    return this.tutorials.find((t) => {
      return PgRouter.isPathsEqual(
        PgCommon.toKebabFromTitle(t.name),
        PgCommon.toKebabFromTitle(name)
      );
    });
  }

  /**
   * Get whether the given workspace name is a tutorial.
   *
   * @param name workspace name
   * @returns whether the given workspace name is a tutorial
   */
  static isWorkspaceTutorial(name: string) {
    return _PgTutorial.tutorials.some((t) => t.name === name);
  }

  /**
   * Get whether the current workspace is a tutorial.
   *
   * @returns whether the current workspace is a tutorial
   */
  static isCurrentWorkspaceTutorial() {
    const workspaceName = PgExplorer.currentWorkspaceName;
    return workspaceName ? this.isWorkspaceTutorial(workspaceName) : false;
  }

  /**
   * Get all tutorial names the user has started.
   *
   * @returns user tutorial names
   */
  static getUserTutorialNames() {
    return PgExplorer.allWorkspaceNames?.filter(this.isWorkspaceTutorial) ?? [];
  }

  /**
   * Get whether the user has started the given tutorial.
   *
   * @param name tutorial name
   * @returns whether the tutorial is started
   */
  static isStarted(name: string | undefined) {
    return (!!name && PgExplorer.allWorkspaceNames?.includes(name)) ?? false;
  }

  /**
   * Get given tutorial's metadata from file system.
   *
   * @param name tutorial name
   * @returns tutorial metadata
   */
  static async getMetadata(name: string): Promise<TutorialMetadata> {
    if (!this.isWorkspaceTutorial(name)) {
      throw new Error(`'${name}' is not a tutorial.`);
    }

    return await PgExplorer.fs.readToJSON(
      PgCommon.joinPaths([PgExplorer.PATHS.ROOT_DIR_PATH, name, storage.PATH])
    );
  }

  /**
   * Open the given tutorial.
   *
   * @param name tutorial name
   */
  static async open(name: string) {
    const { pathname } = await PgRouter.getLocation();
    const tutorialPath = `/tutorials/${PgCommon.toKebabFromTitle(name)}`;

    if (PgRouter.isPathsEqual(pathname, tutorialPath)) {
      // Open the tutorial pages view
      PgTutorial.update({ view: "main" });

      // Sleep before setting the sidebar state to avoid flickering when the
      // current page modifies the sidebar state, e.g. inside `onMount`
      await PgCommon.sleep(0);
      PgView.setSidebarState((state) => {
        if (state === Sidebar.TUTORIALS) return Sidebar.EXPLORER;
        return state;
      });
    } else {
      PgRouter.navigate(tutorialPath);
    }
  }

  /**
   * Start the current tutorial.
   *
   * This method doesn't can only start the current selected tutorial.
   *
   * @param props tutorial properties
   */
  static async start(
    props: { files: TupleFiles; defaultOpenFile?: string } & Pick<
      TutorialMetadata,
      "pageCount"
    >
  ) {
    const tutorialName = PgTutorial.data?.name;
    if (!tutorialName) throw new Error("Tutorial is not selected");

    if (PgExplorer.allWorkspaceNames?.includes(tutorialName)) {
      await this.open(tutorialName);
    } else {
      // Initial tutorial setup
      await PgExplorer.newWorkspace(tutorialName, {
        files: props.files,
        defaultOpenFile: props.defaultOpenFile,
      });

      PgTutorial.update({
        pageNumber: 1,
        pageCount: props.pageCount,
        completed: false,
        view: "main",
      });
    }
  }

  /** Finish the current tutorial. */
  static finish() {
    PgTutorial.completed = true;
    PgView.setSidebarState(Sidebar.TUTORIALS);
  }
}

export const PgTutorial = declareUpdatable(_PgTutorial, { defaultState });
