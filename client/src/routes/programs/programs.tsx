import { PgCommon, PgRouter } from "../../utils/pg";
import { handleRoute } from "../common";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    const programs = {
      name: "Programs",
      props: async () => ({
        programs: await PgCommon.fetchJSON("/programs/programs.json"),
      }),
    };
    return handleRoute({
      main: programs,
      sidebar: programs,
      minimizeSecondaryMainView: true,
    });
  },
});
