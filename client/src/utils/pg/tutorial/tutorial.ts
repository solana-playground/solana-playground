import { PgCommon } from "../common";
import { PgExplorer, TupleFiles } from "../explorer";
import { PgRouter } from "../router";
import { PgView } from "../view";
import {
  createDerivable,
  declareDerivable,
  declareUpdatable,
  derivable,
  initable,
  updatable,
} from "../decorators";
import type {
  TutorialData,
  TutorialMetadata,
  TutorialState,
  TutorialStorageData,
} from "./types";

const defaultState: TutorialState = {
  pageNumber: null,
  completed: null,
};

const storage = {
  /** Relative path to the tutorial info */
  PATH: ".tutorial.json",

  /** Read from storage and deserialize the data. */
  async read(): Promise<TutorialState> {
    if (!PgTutorial.current || !PgTutorial.isStarted(PgTutorial.current.name)) {
      return defaultState;
    }

    return await PgExplorer.fs.readToJSONOrDefault(this.PATH, defaultState);
  },

  /** Serialize the data and write to storage. */
  async write(state: TutorialState) {
    if (!state.pageNumber || !PgExplorer.isInitialized) return;

    await PgExplorer.fs.writeFile(this.PATH, JSON.stringify(state));
  },
};

const onDidInit = () => {
  const disposables = [
    // Navigate to tutorial's route if the current workspace is a tutorial but
    // the user is on the default route
    PgCommon.batchChanges(() => {
      if (PgRouter.location.pathname !== "/") return;

      const name = PgExplorer.currentWorkspaceName;
      if (name && PgTutorial.isWorkspaceTutorial(name)) PgTutorial.open(name);
    }, [PgRouter.onDidChangePath, PgExplorer.onDidInit]),

    // Save tutorial page number to storage when the page changes
    PgTutorial.onDidChangePage((page) => {
      // Updating the `pageNumber` field is enough to write the value to storage
      // because it's an `updatable` field with custom storage
      if (page) PgTutorial.pageNumber = page;
    }),
  ];

  return {
    dispose: () => disposables.forEach(({ dispose }) => dispose()),
  };
};

const derive = () => ({
  /** Current tutorial derived from the URL path */
  current: createDerivable({
    derive: (path) => {
      const route = getTutorialsRoute();

      try {
        const { name } = PgRouter.getParamsFromPath(route.path, path);
        const tutorial = _PgTutorial.all.find((t) => {
          return PgRouter.isPathsEqual(PgCommon.toKebabFromTitle(t.name), name);
        });
        return tutorial;
      } catch (e) {
        console.log("`PgTutorial.current` error:", e);
      }
    },
    onChange: PgRouter.onDidChangePath,
  }),

  /** Tutorial page number derived from the URL path */
  page: createDerivable({
    derive: (path) => {
      const route = getTutorialsRoute();

      try {
        const { page } = PgRouter.getParamsFromPath(route.path, path);
        if (PgCommon.isInt(page)) return parseInt(page);
      } catch (e) {
        console.log("`PgTutorial.page` error:", e);
      }
    },
    onChange: PgRouter.onDidChangePath,
  }),
});

const getTutorialsRoute = () => {
  const route = PgRouter.all.find((route) =>
    route.path.startsWith("/tutorials")
  );
  if (!route) throw new Error("/tutorials route not found");

  return route;
};

@initable({ onDidInit })
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
    if (PgTutorial.current?.name === name && PgTutorial.page) return;

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

  /** Open the about page of the current selected tutorial. */
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
   * @param params tutorial start options
   */
  static async start(params: { files: TupleFiles; defaultOpenFile?: string }) {
    const name = PgTutorial.current?.name;
    if (!name) throw new Error("Tutorial is not selected");

    let pageToOpen: number;
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

  /**
   * Get the current tutorial's storage object that is useful for persisting user
   * data in the current tutorial.
   *
   * The API is rougly the same as the `Storage` API, e.g. `localStorage`, main
   * differences being:
   *
   * - Asynchronous API due to using `indexedDB` under the hood
   * - Optionally, the storage object can be made type-safe
   *
   * # Example
   *
   * ```ts
   * type StorageData {
   *   field: number;
   *   anotherField: string;
   * }
   *
   * const storage = PgTutorial.getStorage<StorageData>({ field: 42, anotherField: "hi" });
   * const field = await storage.getItem("field"); // 42
   * await storage.setItem("field", 0);
   * const newField = await storage.getItem("field"); // 0
   * ```
   *
   * @param defaultValue default value to set initially
   * @returns the tutorial storage
   */
  static getStorage<T extends TutorialStorageData = TutorialStorageData>(
    defaultValue: T
  ) {
    class PgTutorialStorage {
      /**
       * Get the item from the given key.
       *
       * @param key key of the item
       * @returns the value or `undefined` if key doesn't exist
       */
      async getItem<K extends keyof T>(key: K) {
        const data = await this._readFile();
        return data[key];
      }

      /**
       * Set the key-value pair.
       *
       * @param key key of the item
       * @param value value of the item
       */
      async setItem<K extends keyof T>(key: K, value: T[K]) {
        const data = await this._readFile();
        data[key] = value;
        await this._writeFile(data);
      }

      /**
       * Remove the key-value pair if it exists.
       *
       * @param key key of the item
       */
      async removeItem(key: keyof T) {
        const data = await this._readFile();
        delete data[key];
        await this._writeFile(data);
      }

      /** Clear all key-value pairs and reset to the default state. */
      async clear() {
        await this._writeFile(defaultValue);
      }

      /**
       * Read the tutorial storage data file as JSON.
       *
       * @returns the data as JSON
       */
      private async _readFile() {
        return await PgExplorer.fs.readToJSONOrDefault(
          PgTutorialStorage._PATH,
          defaultValue
        );
      }

      /**
       * Save the file with the given storage data.
       *
       * @param data storage data
       */
      private async _writeFile(data: T) {
        await PgExplorer.fs.writeFile(
          PgTutorialStorage._PATH,
          JSON.stringify(data)
        );
      }

      /** Relative path to the tutorial storage JSON file */
      // TODO: Use a constant for `.workspace` (same directory is used in the
      // explorer)
      private static _PATH = ".workspace/tutorial-storage.json";
    }

    return new PgTutorialStorage();
  }
}

export const PgTutorial = declareDerivable(
  declareUpdatable(_PgTutorial, { defaultState }),
  derive
);
