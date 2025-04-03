import { PgCommon } from "../common";
import { PgExplorer, TupleFiles } from "../explorer";
import { PgRouter } from "../router";
import { PgView } from "../view";
import {
  createDerivable,
  declareDerivable,
  declareUpdatable,
  derivable,
  updatable,
} from "../decorators";
import type {
  SerializedTutorialState,
  TutorialData,
  TutorialMetadata,
  TutorialState,
} from "./types";

const defaultState: TutorialState = {
  pageNumber: null,
  completed: null,
  data: null,
};

const storage = {
  /** Relative path to the tutorial info */
  PATH: ".tutorial.json",

  /** Read from storage and deserialize the data. */
  async read(): Promise<TutorialState> {
    if (!PgTutorial.data || !PgTutorial.isStarted(PgTutorial.data.name)) {
      return { ...defaultState, data: PgTutorial.data };
    }

    let serializedState: SerializedTutorialState;
    try {
      serializedState = await PgExplorer.fs.readToJSON(this.PATH);
    } catch {
      return { ...defaultState, data: PgTutorial.data };
    }

    return {
      ...defaultState,
      ...serializedState,
      pageNumber: serializedState.pageNumber,
      data: PgTutorial.data,
    };
  },

  /** Serialize the data and write to storage. */
  async write(state: TutorialState) {
    if (!PgTutorial.data || !PgTutorial.isStarted(PgTutorial.data.name)) {
      return;
    }

    // Don't use spread operator(...) because of the extra state
    const serializedState: SerializedTutorialState = {
      pageNumber: state.pageNumber ?? 1,
      completed: state.completed,
    };

    await PgExplorer.fs.writeFile(this.PATH, JSON.stringify(serializedState));
  },
};

const derive = () => ({
  /** Tutorial page number derived from the URL path */
  page: createDerivable({
    derive: (path) => {
      // TODO: Fix `path` being `undefined`
      path = PgRouter.location.pathname;
      const route = PgRouter.all.find((route) =>
        route.path.startsWith("/tutorials")
      );
      if (!route) throw new Error("/tutorials route not found");

      try {
        const { page } = PgRouter.getParamsFromPath(route.path, path);
        if (PgCommon.isInt(page)) return parseInt(page);
      } catch {}
    },
    onChange: PgRouter.onDidChangePath,
  }),

  /** Save tutorial page number to storage */
  // TODO: Find a better way to save
  __save: createDerivable({
    derive: () => {
      if (PgTutorial.page) PgTutorial.pageNumber = PgTutorial.page;
    },
    onChange: "page",
  }),
});

@derivable(derive)
@updatable({ defaultState, storage })
class _PgTutorial {
  /** All tutorials */
  static all: TutorialData[];

  /**
   * Get whether the given workspace name is a tutorial.
   *
   * @param name workspace name
   * @returns whether the given workspace name is a tutorial
   */
  static isWorkspaceTutorial(name: string) {
    return _PgTutorial.all.some((t) => t.name === name);
  }

  /**
   * Get all tutorial names the user has started.
   *
   * @returns user tutorial names
   */
  static getUserTutorialNames() {
    if (!PgExplorer.allWorkspaceNames) {
      throw new Error("Explorer not initialized");
    }
    return PgExplorer.allWorkspaceNames.filter(this.isWorkspaceTutorial);
  }

  /**
   * Get whether the user has started the given tutorial.
   *
   * @param name tutorial name
   * @returns whether the tutorial is started
   */
  static isStarted(name: string) {
    return PgExplorer.allWorkspaceNames?.includes(name) ?? false;
  }

  /**
   * Get given tutorial's metadata from file system.
   *
   * @param name tutorial name
   * @returns tutorial metadata
   */
  static async getMetadata(name: string) {
    return await PgExplorer.fs.readToJSON<TutorialMetadata>(
      PgCommon.joinPaths(PgExplorer.PATHS.ROOT_DIR_PATH, name, storage.PATH)
    );
  }

  /**
   * Open the given tutorial.
   *
   * @param name tutorial name
   */
  static async open(name: string) {
    // Do not open if it's already open
    if (PgTutorial.data?.name === name && PgTutorial.page) return;

    const tutorialPath = `/tutorials/${PgCommon.toKebabFromTitle(name)}`;
    if (this.isStarted(name)) {
      try {
        const { pageNumber } = await this.getMetadata(name);
        PgRouter.navigate(tutorialPath + "/" + pageNumber);
      } catch {
        PgRouter.navigate(tutorialPath + "/" + 1);
      }
    } else {
      PgRouter.navigate(tutorialPath);
    }
  }

  /**
   * Open the about page of the current selected tutorial.
   *
   * @param name tutorial name
   */
  static async openAboutPage() {
    const tutorialPath = PgRouter.location.pathname
      .split("/")
      .slice(0, 3)
      .join("/");
    PgRouter.navigate(tutorialPath);
  }

  /**
   * Open the given page of the current selected tutorial.
   *
   * @param pageNumber page number to open
   */
  static openPage(pageNumber: number) {
    const paths = PgRouter.location.pathname.split("/");
    const hasPage = paths.length === 4;
    const page = pageNumber.toString();
    if (hasPage) paths[paths.length - 1] = page;
    else paths.push(page);

    PgRouter.navigate(paths.join("/"));
  }

  /**
   * Start the current tutorial.
   *
   * This method can only start the current selected tutorial.
   *
   * @param props tutorial properties
   */
  static async start(params: { files: TupleFiles; defaultOpenFile?: string }) {
    const name = PgTutorial.data?.name;
    if (!name) throw new Error("Tutorial is not selected");

    let pageToOpen: number | null;
    if (!this.isStarted(name)) {
      // Initial tutorial setup
      await PgExplorer.createWorkspace(name, params);

      pageToOpen = PgTutorial.page ?? 1;
      PgTutorial.update({ completed: false, pageNumber: pageToOpen });
    } else {
      // Get the saved page
      const { pageNumber } = await this.getMetadata(name);
      pageToOpen = pageNumber;
    }

    this.openPage(pageToOpen);
  }

  /** Finish the current tutorial. */
  static finish() {
    PgTutorial.completed = true;
    PgView.setSidebarPage("Tutorials");
  }
}

export const PgTutorial = declareDerivable(
  declareUpdatable(_PgTutorial, { defaultState }),
  derive
);
