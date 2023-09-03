import { EditorWithTabs } from "../components/EditorWithTabs";
import { PgExplorer, PgGithub, PgRouter, PgView } from "../utils/pg";

export const githubDefault = PgRouter.create({
  path: "/{githubUrl}",
  validate: ({ githubUrl }) => PgGithub.isValidUrl(githubUrl),
  handle: ({ githubUrl }) => {
    // Set main view
    PgView.setMain(async () => {
      PgView.setSidebarLoading(true);

      // Get repository data
      const files = await PgGithub.getExplorerFiles(githubUrl);

      // Initialize explorer
      await PgExplorer.init({ files });

      // Set sidebar
      PgView.setSidebarPage();

      return EditorWithTabs;
    });
  },
});

export const github = PgRouter.create({
  path: "/github/{url}",
  handle: ({ url }) => {
    // Redirect to `/{githubUrl}`
    PgRouter.navigate(url);
  },
});
