import { PgCommon, PgRouter } from "../../utils/pg";
import { handleRoute } from "../common";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    return handleRoute({
      main: async () => {
        const programs = await PgCommon.fetchJSON("/programs/programs.json");
        const { Programs } = await import("../../views/main/primary/Programs");
        return <Programs programs={programs} />;
      },
      sidebar: "Programs",
      minimizeSecondaryMainView: true,
    });
  },
});
