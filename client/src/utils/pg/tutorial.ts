import { TutorialData } from "../../components/Tutorial";
import { EventName } from "../../constants";
import { PgCommon } from "./common";

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

  static async getTutorialWorkspaceName() {
    const tutorial = await this.getCurrent();
    return `${PgTutorial.PREFIX}-${PgCommon.toKebabCase(tutorial.name)}`;
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
}
