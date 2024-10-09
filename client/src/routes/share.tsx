import { PgExplorer, PgRouter, PgShare, PgView } from "../utils/pg";

export const share = PgRouter.create({
  path: "/{shareId}",
  validate: ({ shareId }) => PgShare.isValidId(shareId),
  handle: ({ shareId }) => {
    // Set main view
    PgView.setMain(async () => {
      PgView.setSidebarLoading(true);

      try {
        // Get the share data
        const files = await PgShare.get(shareId);

        // Initialize explorer
        await PgExplorer.init({ files });

        const { EditorWithTabs } = await import(
          "../views/main/primary/EditorWithTabs"
        );
        return EditorWithTabs;
      } finally {
        // Set sidebar
        PgView.setSidebarPage();
        PgView.setSidebarLoading(false);
      }
    });
  },
});
