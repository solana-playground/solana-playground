import { PgExplorer, PgRouter, PgView } from "../utils/pg";

export const notFound = PgRouter.create({
  path: "/{invalidPath}",
  handle: ({ invalidPath }) => {
    PgView.setSidebarLoading(true);

    PgView.setMainPrimary(async () => {
      // Initialize explorer
      await PgExplorer.init();

      const { NotFound } = await import("../views/main/primary/NotFound");
      return <NotFound path={invalidPath} />;
    });

    return {
      dispose: () => {
        PgView.setSidebarLoading(false);
      },
    };
  },
});
