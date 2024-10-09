import { PgExplorer, PgGithub, PgRouter, PgView } from "../utils/pg";

export const githubDefault = PgRouter.create({
  path: "/{githubUrl}",
  validate: ({ githubUrl }) => PgGithub.isValidUrl(githubUrl),
  handle: ({ githubUrl }) => {
    // Set main view
    PgView.setMain(async () => {
      PgView.setSidebarLoading(true);

      try {
        // Get repository data
        const files = await PgGithub.getFiles(githubUrl);

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

export const github = PgRouter.create({
  path: "/github/{url}",
  handle: ({ url }) => {
    // Redirect to `/{githubUrl}`
    PgRouter.navigate(url);
  },
});
