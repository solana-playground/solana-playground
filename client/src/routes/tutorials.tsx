import { PgRouter } from "../utils/pg";
import { handleRoute } from "./utils";

export const tutorials = PgRouter.create({
  path: "/tutorials",
  handle: () => {
    return handleRoute({
      getMain: async () => {
        const { Tutorials } = await import("../views/main/primary/Tutorials");
        return Tutorials;
      },
      sidebar: "Tutorials",
      minimizeSecondaryMainView: true,
    });
  },
});
