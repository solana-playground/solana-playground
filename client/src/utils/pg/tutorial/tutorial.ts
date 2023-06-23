import { PgCommon } from "../common";
import { PgExplorer } from "../explorer";
import { PgRouter } from "../router";
import { PgView, Sidebar } from "../view";
import { EventName, Route } from "../../../constants";
import { TUTORIALS } from "../../../tutorials";
import type { TutorialData, TutorialMetadata } from "./types";
import type { TutorialComponentProps } from "../../../components/Tutorial";

export class PgTutorial {
  static async getCurrent(): Promise<TutorialData> {
    return await PgCommon.sendAndReceiveCustomEvent(
      PgCommon.getStaticStateEventNames(EventName.TUTORIAL_STATIC).get
    );
  }

  static setCurrent(tutorial: TutorialData) {
    PgCommon.createAndDispatchCustomEvent(
      PgCommon.getStaticStateEventNames(EventName.TUTORIAL_STATIC).set,
      tutorial
    );
  }

  static getTutorialData(tutorialName: string) {
    return TUTORIALS.find((t) => t.name === tutorialName);
  }

  static getTutorialFromPathname(pathname: string) {
    return TUTORIALS.find(
      (t) =>
        PgCommon.appendSlash(PgCommon.toKebabFromTitle(t.name)) ===
        PgCommon.appendSlash(pathname.split(`${Route.TUTORIALS}/`)[1])
    );
  }

  static async getPageNumber(): Promise<number> {
    return await PgCommon.sendAndReceiveCustomEvent(
      PgCommon.getStaticStateEventNames(EventName.TUTORIAL_PAGE_STATIC).get
    );
  }

  static setPageNumber(pageNumber: number) {
    PgCommon.createAndDispatchCustomEvent(
      PgCommon.getStaticStateEventNames(EventName.TUTORIAL_PAGE_STATIC).set,
      pageNumber
    );
  }

  static isWorkspaceTutorial(workspaceName: string) {
    return TUTORIALS.some((t) => t.name === workspaceName);
  }

  static isCurrentWorkspaceTutorial() {
    const workspaceName = PgExplorer.currentWorkspaceName;
    return workspaceName ? this.isWorkspaceTutorial(workspaceName) : false;
  }

  static async open(tutorialName: string) {
    const { pathname } = await PgRouter.getLocation();
    const tutorialPath = `${Route.TUTORIALS}/${PgCommon.toKebabFromTitle(
      tutorialName
    )}`;

    if (PgRouter.comparePaths(pathname, tutorialPath)) {
      // Open the tutorial pages view
      try {
        const metadata = await this.getMetadata();
        this.setPageNumber(metadata.pageNumber);
        PgView.setSidebarState((state) => {
          if (state === Sidebar.TUTORIALS) return Sidebar.EXPLORER;
          return state;
        });
      } catch {}
    } else {
      PgRouter.navigate(tutorialPath);
    }
  }

  static async start(
    props: Pick<TutorialComponentProps, "files" | "defaultOpenFile"> &
      Pick<TutorialMetadata, "pageCount">
  ) {
    const tutorialName = (await this.getCurrent()).name;

    let tutorialMetaExists;
    if (PgExplorer.allWorkspaceNames?.includes(tutorialName)) {
      // Start from where the user left off
      if (PgExplorer.currentWorkspaceName !== tutorialName) {
        await PgExplorer.switchWorkspace(tutorialName);
      }

      // Read tutorial metadata file
      try {
        const metadata = await this.getMetadata();
        this.setPageNumber(metadata.pageNumber);
        tutorialMetaExists = true;
      } catch {}
    } else {
      // Initial tutorial setup
      await PgExplorer.newWorkspace(tutorialName, {
        files: props.files,
        defaultOpenFile: props.defaultOpenFile,
      });
    }

    if (!tutorialMetaExists) {
      // Create tutorial metadata file
      const metadata: TutorialMetadata = {
        pageNumber: 1,
        pageCount: props.pageCount,
      };
      await PgExplorer.fs.writeFile(
        this._getTutorialMetadataPath(),
        JSON.stringify(metadata)
      );
    }

    PgView.setSidebarState();
  }

  static async finish() {
    await PgTutorial.saveTutorialMetadata({ completed: true });
    PgView.setSidebarState(Sidebar.TUTORIALS);
  }

  static async saveTutorialMetadata(updatedMeta: Partial<TutorialMetadata>) {
    try {
      const currentMeta = await this.getMetadata();
      await PgExplorer.fs.writeFile(
        this._getTutorialMetadataPath(),
        JSON.stringify({ ...currentMeta, ...updatedMeta })
      );
    } catch {}
  }

  static async getMetadata(tutorialName?: string): Promise<TutorialMetadata> {
    return await PgExplorer.fs.readToJSON(
      this._getTutorialMetadataPath(tutorialName)
    );
  }

  static getUserTutorialNames() {
    return PgExplorer.allWorkspaceNames!.filter(this.isWorkspaceTutorial);
  }

  private static readonly TUTORIAL_METADATA_FILENAME = ".tutorial.json";

  private static _getTutorialMetadataPath(tutorialName?: string) {
    return tutorialName
      ? PgCommon.joinPaths([
          PgExplorer.PATHS.ROOT_DIR_PATH,
          tutorialName,
          this.TUTORIAL_METADATA_FILENAME,
        ])
      : this.TUTORIAL_METADATA_FILENAME;
  }
}
