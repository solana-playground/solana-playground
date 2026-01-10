import {
  PgCommon,
  PgFramework,
  PgRouter,
  TUTORIAL_CATEGORIES,
} from "../../utils";
import { handleRoute } from "../common";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    const programs = {
      name: "Programs",
      props: async () => ({
        programs: await PgCommon.fetchJSON("/programs/programs.json"),
        filters: [
          { param: "framework", filters: PgFramework.all.map((f) => f.name) },
          { param: "categories", filters: TUTORIAL_CATEGORIES },
        ],
      }),
    };
    return handleRoute({
      main: programs,
      sidebar: programs,
      minimizeSecondaryMainView: true,
    });
  },
});
