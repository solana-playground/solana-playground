import { TutorialData } from "../../components/Tutorial";
import { EventName, Route } from "../../constants";
import { TUTORIALS } from "../../tutorials";
import { PgCommon } from "./common";
import { PgExplorer } from "./explorer";
import { PgRouter } from "./router";

export class PgTutorial {
  static readonly PREFIX = "tutorial";

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

  static async isCurrentWorkspaceTutorial() {
    const workspaceName = (await PgExplorer.get())?.currentWorkspaceName;
    return TUTORIALS.some((t) => t.name === workspaceName);
  }

  static openTutorial(tutorialName: string) {
    PgRouter.navigate(
      `${Route.TUTORIALS}/${PgCommon.toKebabCase(tutorialName)}`
    );
  }
}
