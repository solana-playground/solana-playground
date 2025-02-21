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

let tutorialInit: Disposable | undefined;
let isTutorialInView = false;
let mainSecondaryHeight = 0;

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
  if (!isTutorialInView) {
    // Set main view
    PgView.setMainPrimary(async () => {
      // Initialize explorer
      await PgExplorer.init({ name: tutorial.name });

      // Set the current tutorial data, has to happen before tutorial init
      PgTutorial.data = tutorial;

      // Initialize tutorial
      tutorialInit = await PgTutorial.init();

      isTutorialInView = true;

      const { default: Tutorial } = await tutorial.importComponent();
      return <Tutorial {...tutorial} />;
    });
  }

  // Handle sidebar
  PgView.setSidebarPage((sidebar) => {
    if (!page) return "Tutorials";
    return sidebar === "Tutorials" ? "Explorer" : sidebar;
  });
  const sidebarPage = PgView.onDidChangeSidebarPage((page) => {
    if (page.name === "Tutorials") {
      PgTutorial.openAboutPage();
    } else {
      const started = PgTutorial.isStarted(tutorial.name);
      if (started) PgTutorial.open(tutorial.name);
      else PgRouter.navigate();
    }
  });

  // Minimize secondary main view and reopen on navigation to other routes
  PgView.setMainSecondaryHeight((h) => {
    mainSecondaryHeight = h;
    return page ? mainSecondaryHeight : 0;
  });

  // Handle workspace switch
  const switchWorkspace = PgExplorer.onDidSwitchWorkspace(() => {
    const name = PgExplorer.currentWorkspaceName;
    if (!name || name === tutorial.name) return;

    if (PgTutorial.isWorkspaceTutorial(name)) PgTutorial.open(name);
    else PgRouter.navigate();
  });

  return {
    dispose: () => {
      tutorialInit?.dispose();
      sidebarPage.dispose();

      // Set the main secondary view height to the previous saved value
      PgView.setMainSecondaryHeight(mainSecondaryHeight);

      switchWorkspace.dispose();

      // If the new path is still the same tutorial, return early to skip the
      // loading process of the primary main view
      try {
        const newParams = PgRouter.getParamsFromPath(
          tutorials.path,
          PgRouter.location.pathname
        );
        if (newParams.name === name) return;
      } catch {}
      isTutorialInView = false;
    },
  };
};
