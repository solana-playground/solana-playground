import {
  Disposable,
  PgExplorer,
  PgRouter,
  PgTutorial,
  PgView,
  Sidebar,
} from "../utils/pg";

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

    let tutorialInit: Disposable | undefined;
    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init({ name: tutorial.name });

      // Set the current tutorial data
      PgTutorial.data = tutorial;

      // Initialize tutorial
      tutorialInit = await PgTutorial.init();

      if (PgTutorial.isTutorialStarted(tutorial.name)) {
        PgTutorial.view = "main";
        PgView.setSidebarState();
      } else {
        PgTutorial.view = "about";
        PgView.setSidebarState(Sidebar.TUTORIALS);
      }

      const { default: Tutorial } = await tutorial.elementImport();
      return <Tutorial {...tutorial} />;
    });

    // Handle sidebar
    const sidebarState = PgView.onDidChangeSidebarState((state) => {
      if (state === Sidebar.TUTORIALS) {
        PgTutorial.update({ view: "about" });
      } else {
        // Get whether the tutorial has started
        const tutorialStarted = PgTutorial.getUserTutorialNames().includes(
          tutorial.name
        );
        if (!tutorialStarted) PgRouter.navigate();
        else PgTutorial.update({ view: "main" });
      }
    });

    return {
      dispose: () => {
        tutorialInit?.dispose();
        sidebarState.dispose();
      },
    };
  },
});
