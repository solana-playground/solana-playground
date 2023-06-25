import { PgCommon } from "../common";
import { PgExplorer, TupleFiles } from "../explorer";
import { PgRouter } from "../router";
import { PgView, Sidebar } from "../view";
import { TUTORIALS } from "../../../tutorials";
import { declareUpdatable, updatable } from "../decorators";
import type {
  SerializedTutorialState,
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
    if (
      !PgTutorial.data?.name ||
      !PgTutorial.isTutorialStarted(PgTutorial.data.name)
    ) {
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
    if (
      !PgTutorial.data?.name ||
      !PgTutorial.isTutorialStarted(PgTutorial.data.name)
    ) {
      return;
    }

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
  static getTutorialData(tutorialName: string) {
    return TUTORIALS.find((t) => t.name === tutorialName);
  }

  static getTutorialFromKebab(tutorialName: string) {
    return TUTORIALS.find((t) => {
      return PgRouter.isPathsEqual(
        PgCommon.toKebabFromTitle(t.name),
        tutorialName
      );
    });
  }

  static isWorkspaceTutorial(workspaceName: string) {
    return TUTORIALS.some((t) => t.name === workspaceName);
  }

  static isCurrentWorkspaceTutorial() {
    const workspaceName = PgExplorer.currentWorkspaceName;
    return workspaceName ? this.isWorkspaceTutorial(workspaceName) : false;
  }

  static getUserTutorialNames() {
    return PgExplorer.allWorkspaceNames?.filter(this.isWorkspaceTutorial) ?? [];
  }

  static isTutorialStarted(name: string) {
    return PgExplorer.allWorkspaceNames?.includes(name) ?? false;
  }

  static async getMetadata(name: string): Promise<TutorialMetadata> {
    if (!PgTutorial.isWorkspaceTutorial(name)) {
      throw new Error(`'${name}' is not a tutorial.`);
    }

    return await PgExplorer.fs.readToJSON(
      PgCommon.joinPaths([PgExplorer.PATHS.ROOT_DIR_PATH, name, storage.PATH])
    );
  }

  static async open(tutorialName: string) {
    const { pathname } = await PgRouter.getLocation();
    const tutorialPath = `/tutorials/${PgCommon.toKebabFromTitle(
      tutorialName
    )}`;

    if (PgRouter.isPathsEqual(pathname, tutorialPath)) {
      // Open the tutorial pages view
      PgTutorial.update({ view: "main" });
      PgView.setSidebarState((state) => {
        if (state === Sidebar.TUTORIALS) return Sidebar.EXPLORER;
        return state;
      });
    } else {
      PgRouter.navigate(tutorialPath);
    }
  }

  static async start(
    props: { files: TupleFiles; defaultOpenFile?: string } & Pick<
      TutorialMetadata,
      "pageCount"
    >
  ) {
    const tutorialName = PgTutorial.data?.name;
    if (!tutorialName) throw new Error("Tutorial is not selected");

    if (PgExplorer.allWorkspaceNames!.includes(tutorialName)) {
      if (PgExplorer.currentWorkspaceName === tutorialName) {
        await this.open(tutorialName);
      } else {
        await PgExplorer.switchWorkspace(tutorialName);
      }
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

    PgView.setSidebarState();
  }

  static finish() {
    PgTutorial.completed = true;
    PgTutorial.view = "about";
    PgView.setSidebarState(Sidebar.TUTORIALS);
  }
}

export const PgTutorial = declareUpdatable(_PgTutorial, { defaultState });
