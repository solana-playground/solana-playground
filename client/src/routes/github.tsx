import { EditorWithTabs } from "../components/EditorWithTabs";
import { PgExplorer, PgGithub, PgRouter, PgView } from "../utils/pg";

export const github = PgRouter.create({
  path: "/github/{url}",
  handle: ({ url }) => {
    // Set main view
    PgView.setMain(async () => {
      PgView.setSidebarLoading(true);

      // Get repository data
      const files = await PgGithub.getExplorerFiles(url);

      // Initialize explorer
      await PgExplorer.init({ files });

      // Set sidebar
      PgView.setSidebarPage();

      return EditorWithTabs;
    });
  },
});
