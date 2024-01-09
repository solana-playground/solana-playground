import {
  Disposable,
  PgExplorer,
  PgRouter,
  PgTutorial,
  PgView,
} from "../utils/pg";

export const tutorial = PgRouter.create({
  path: "/tutorials/{tutorialName}",
  handle: ({ tutorialName }) => {
    // Get the tutorial
    const tutorial = PgTutorial.getTutorialData(tutorialName);

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

      // Set the current tutorial data, has to happen before tutorial init
      PgTutorial.data = tutorial;

      // Initialize tutorial
      tutorialInit = await PgTutorial.init();

      if (PgTutorial.isStarted(tutorial.name)) {
        PgTutorial.view = "main";
        PgView.setSidebarPage();
      } else {
        PgTutorial.view = "about";
        PgView.setSidebarPage("Tutorials");
      }

      const { default: Tutorial } = await tutorial.elementImport();
      return <Tutorial {...tutorial} />;
    });

    // Handle sidebar
    const sidebarPage = PgView.onDidChangeSidebarPage((state) => {
      if (state === "Tutorials") {
        PgTutorial.update({ view: "about" });
      } else {
        // Get whether the tutorial has started
        const started = PgTutorial.isStarted(tutorial.name);
        if (started) PgTutorial.update({ view: "main" });
        else PgRouter.navigate();
      }
    });

    return {
      dispose: () => {
        tutorialInit?.dispose();
        sidebarPage.dispose();
      },
    };
  },
});
