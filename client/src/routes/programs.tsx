import { Programs } from "../components/Programs";
import { PgExplorer, PgRouter, PgView } from "../utils/pg";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init();

      // Set sidebar
      PgView.setSidebarPage("Programs");

      return Programs;
    });

    // Handle sidebar
    return PgView.onDidChangeSidebarPage((state) => {
      if (state !== "Programs") PgRouter.navigate();
    });
  },
});
