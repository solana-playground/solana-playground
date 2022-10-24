import { Sidebar } from "../../components/Panels/Side/sidebar-state";
import {
  TutorialComponentProps,
  TutorialData,
} from "../../components/Tutorial";
import { EventName, Route } from "../../constants";
import { TUTORIALS } from "../../tutorials";
import { PgCommon } from "./common";
import { PgExplorer } from "./explorer";
import { PgRouter } from "./router";
import { PgView } from "./view";

interface TutorialMetadata {
  page: number;
}

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
    return this.isWorkspaceTutorial(workspaceName!);
  }

  static open(tutorialName: string) {
    PgRouter.navigate(
      `${Route.TUTORIALS}/${PgCommon.toKebabCase(tutorialName)}`
    );
  }

  static async start(
    tutorialName: string,
    props: Pick<TutorialComponentProps, "files" | "defaultOpenFile">
  ) {
    const explorer = await PgExplorer.get();
    if (explorer.allWorkspaceNames?.includes(tutorialName)) {
      // Start from where the user left off
      if (explorer.currentWorkspaceName !== tutorialName) {
        await explorer.changeWorkspace(tutorialName);
      }

      // Read tutorial metadata file
      const metadata = await this.getMetadata();
      this.setPageNumber(metadata.page);
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
      const metadata: TutorialMetadata = { page: 0 };
      await explorer.newItem(
        this.TUTORIAL_METADATA_FILENAME,
        JSON.stringify(metadata),
        { skipNameValidation: true, openOptions: { dontOpen: true } }
      );
      this.setPageNumber(1);
    }
    PgView.setSidebarState(Sidebar.EXPLORER);
  }

  static async saveTutorialMeta(updatedMeta: Partial<TutorialMetadata>) {
    try {
      const currentMeta = await this.getMetadata();
      await PgExplorer.run({
        newItem: [
          this.TUTORIAL_METADATA_FILENAME,
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

  static async getMetadata(): Promise<TutorialMetadata> {
    return JSON.parse(
      await PgExplorer.run({ readToString: [this.TUTORIAL_METADATA_FILENAME] })
    );
  }
}
