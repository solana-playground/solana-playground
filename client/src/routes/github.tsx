import EditorWithTabs from "../pages/ide/Panels/Main/MainView/EditorWithTabs";
import { PgExplorer, PgGithub, PgRouter, PgView, Sidebar } from "../utils/pg";

export const github = PgRouter.create({
  path: "/github/{url}",
  handle: ({ url }) => {
    PgView.setMain(async () => {
      PgView.setSidebarLoading(true);

      // Get repository data
      const files = await PgGithub.getExplorerFiles(url);

      // Initialize explorer
      await PgExplorer.init({ files });

      // Set sidebar
      PgView.setSidebarState();

      return EditorWithTabs;
    });

    // Handle sidebar
    const { dispose } = PgView.onDidChangeSidebarState((state) => {
      if (state === Sidebar.TUTORIALS) PgRouter.navigate("/tutorials");
    });

    return () => dispose();
  },
});
