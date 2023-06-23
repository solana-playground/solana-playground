import { PgExplorer, PgRouter, PgTutorial, PgView, Sidebar } from "../utils/pg";

export const tutorial = PgRouter.create({
  path: "/tutorials/{tutorialName}",
  handle: ({ tutorialName }) => {
    // Get the tutorial
    const tutorial = PgTutorial.getTutorialFromKebab(tutorialName);

    // Check whether the tutorial exists
    if (!tutorial) {
      PgRouter.navigate();
      return;
    }

    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init({ name: tutorial.name });

      // Set the current tutorial
      PgTutorial.setCurrent(tutorial);

      // Set sidebar only when the page number is 0
      try {
        const { pageNumber } = await PgTutorial.getMetadata(tutorial.name);
        if (pageNumber === 0) PgView.setSidebarState(Sidebar.TUTORIALS);
        else PgView.setSidebarState();
      } catch {
        // Metadata file doesn't exist
        PgView.setSidebarState(Sidebar.TUTORIALS);
      }

      const { default: Tutorial } = await tutorial.elementImport();
      return <Tutorial {...tutorial} />;
    });

    // Handle sidebar
    const { dispose } = PgView.onDidChangeSidebarState((state) => {
      if (state === Sidebar.TUTORIALS) {
        PgTutorial.setPageNumber(0);
      } else {
        // Get whether the tutorial has started
        const tutorialStarted = PgTutorial.getUserTutorialNames().includes(
          tutorial.name
        );
        if (!tutorialStarted) {
          PgRouter.navigate();
        } else {
          PgTutorial.open(tutorial.name);
        }
      }
    });

    return () => dispose();
  },
});
