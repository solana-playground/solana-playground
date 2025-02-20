import {
  Disposable,
  PgCommon,
  PgExplorer,
  PgRouter,
  PgTutorial,
  PgView,
} from "../../utils/pg";
import { handleRoute } from "../common";

export const tutorials = PgRouter.create({
  path: "/tutorials/{name}/{page}",
  handle: ({ name, page }) => {
    if (name) return handleTutorial(name, page);

    return handleRoute({
      main: "Tutorials",
      sidebar: "Tutorials",
      minimizeSecondaryMainView: true,
    });
  },
});

let isTutorialInView = false;

const handleTutorial = (name: string, page: string) => {
  // Get the tutorial
  const tutorial = PgTutorial.all.find((t) => {
    return PgRouter.isPathsEqual(PgCommon.toKebabFromTitle(t.name), name);
  });

  // Check whether the tutorial exists
  if (!tutorial) {
    PgRouter.navigate();
    return;
  }

  // Only change the page if the tutorial is already in view
  if (isTutorialInView && page) {
    PgTutorial.pageNumber = parseInt(page);
    return;
  }

  let tutorialInit: Disposable | undefined;
  // Set main view
  PgView.setMainPrimary(async () => {
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

    if (page) PgTutorial.pageNumber = parseInt(page);

    isTutorialInView = true;

    const { default: Tutorial } = await tutorial.importComponent();
    return <Tutorial {...tutorial} />;
  });

  // Handle sidebar
  const sidebarPage = PgView.onDidChangeSidebarPage((page) => {
    if (page.name === "Tutorials") {
      PgTutorial.view = "about";
    } else {
      // Get whether the tutorial has started
      const started = PgTutorial.isStarted(tutorial.name);
      if (started) PgTutorial.view = "main";
      else PgRouter.navigate();
    }
  });

  // Minimize secondary main view and reopen on navigation to other routes
  let mainSecondaryHeight = 0;
  const tutorialView = PgTutorial.onDidChangeView((view) => {
    if (!view) return;

    PgView.setMainSecondaryHeight((h) => {
      switch (view) {
        case "main":
          if (mainSecondaryHeight) return mainSecondaryHeight;

          mainSecondaryHeight = h;
          return h;

        case "about":
          mainSecondaryHeight = h;
          return 0;
      }
    });
  });

  // Handle workspace switch
  const switchWorkspace = PgExplorer.onDidSwitchWorkspace(async () => {
    const name = PgExplorer.currentWorkspaceName;
    if (!name) return;

    if (PgTutorial.isWorkspaceTutorial(name)) await PgTutorial.open(name);
    else PgRouter.navigate();
  });

  return {
    dispose: () => {
      // If the new path is still the same tutorial with a different page,
      // change the page without disposing anything
      try {
        const newParams = PgRouter.getParamsFromPath(
          tutorials.path,
          PgRouter.location.pathname
        );
        if (newParams.name === name && newParams.page) {
          PgTutorial.pageNumber = parseInt(newParams.page);
          return;
        }
      } catch {}

      tutorialInit?.dispose();
      sidebarPage.dispose();

      // Set the main secondary view height to the previous saved value
      PgView.setMainSecondaryHeight(mainSecondaryHeight);
      tutorialView.dispose();

      switchWorkspace.dispose();
      isTutorialInView = false;
    },
  };
};
