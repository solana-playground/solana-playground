import { Sidebar } from "../../../components/Panels/Side/sidebar-state";
import { TutorialComponentProps } from "../../../components/Tutorial";
import { EventName, Route } from "../../../constants";
import { TUTORIALS } from "../../../tutorials";
import { PgCommon } from "../common";
import { PgExplorer } from "../explorer";
import { PgRouter } from "../router";
import { PgView } from "../view";
import { TutorialData, TutorialMetadata } from "./types";

export class PgTutorial {
  private static readonly TUTORIAL_METADATA_FILENAME = ".tutorial.json";

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
        PgCommon.toKebabCase(t.name) ===
        pathname.split(`${Route.TUTORIALS}/`)[1]
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

  static async isCurrentWorkspaceTutorial() {
    const workspaceName = (await PgExplorer.get())?.currentWorkspaceName;
    return workspaceName ? this.isWorkspaceTutorial(workspaceName) : false;
  }

  static async open(tutorialName: string) {
    const { pathname } = await PgRouter.getLocation();
    const tutorialPath = `${Route.TUTORIALS}/${PgCommon.toKebabCase(
      tutorialName
    )}`;
    if (pathname === tutorialPath) {
      // Open the tutorial pages view
      try {
        const metadata = await this.getMetadata();
        this.setPageNumber(metadata.pageNumber);
        PgView.setSidebarState(Sidebar.EXPLORER);
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

    const explorer = await PgExplorer.get();
    if (explorer.allWorkspaceNames?.includes(tutorialName)) {
      // Start from where the user left off
      if (explorer.currentWorkspaceName !== tutorialName) {
        await explorer.changeWorkspace(tutorialName);
      }

      // Read tutorial metadata file
      const metadata = await this.getMetadata();
      this.setPageNumber(metadata.pageNumber);
    } else {
      // Initial tutorial setup
      await explorer.newWorkspace(tutorialName, {
        files: props.files,
        defaultOpenFile:
          props.files.length > 0
            ? props.defaultOpenFile ?? props.files[0][0]
            : undefined,
      });

      // Create tutorial metadata file
      const metadata: TutorialMetadata = {
        pageNumber: 0,
        pageCount: props.pageCount,
      };
      await explorer.newItem(
        this._getTutorialMetadataPath(),
        JSON.stringify(metadata),
        { skipNameValidation: true, openOptions: { dontOpen: true } }
      );
      this.setPageNumber(1);
    }
    PgView.setSidebarState(Sidebar.EXPLORER);
  }

  static async finish() {
    await PgTutorial.saveTutorialMeta({ completed: true });
    PgView.setSidebarState(Sidebar.TUTORIALS);
  }

  static async saveTutorialMeta(
    updatedMeta: Partial<TutorialMetadata>,
    tutorialName?: string
  ) {
    try {
      const currentMeta = await this.getMetadata();
      await PgExplorer.run({
        newItem: [
          this._getTutorialMetadataPath(tutorialName),
          JSON.stringify({ ...currentMeta, ...updatedMeta }),
          {
            override: true,
            skipNameValidation: true,
            openOptions: { dontOpen: true },
          },
        ],
      });
    } catch {}
  }

  static async getMetadata(tutorialName?: string): Promise<TutorialMetadata> {
    return JSON.parse(
      await PgExplorer.run({
        readToString: [this._getTutorialMetadataPath(tutorialName)],
      })
    );
  }

  static getTutorialsCount() {
    return TUTORIALS.length;
  }

  static async getUserTutorialNames() {
    return (await PgExplorer.get()).allWorkspaceNames!.filter(
      this.isWorkspaceTutorial
    );
  }

  private static _getTutorialMetadataPath(tutorialName?: string) {
    return tutorialName
      ? PgExplorer.joinPaths([
          PgExplorer.PATHS.ROOT_DIR_PATH,
          tutorialName,
          this.TUTORIAL_METADATA_FILENAME,
        ])
      : this.TUTORIAL_METADATA_FILENAME;
  }
}
