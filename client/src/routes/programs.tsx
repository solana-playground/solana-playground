import { PgCommon, PgRouter } from "../utils/pg";
import { handleRoute } from "./utils";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    return handleRoute({
      getMain: async () => {
        const programs = await PgCommon.fetchJSON("/programs/programs.json");
        const { Programs } = await import("../views/main/primary/Programs");
        return <Programs programs={programs} />;
      },
      sidebar: "Programs",
      minimizeSecondaryMainView: true,
    });
  },
});
