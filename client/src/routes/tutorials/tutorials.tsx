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

let disposables: Disposable[] = [];
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
      disposables.push(await PgTutorial.init());
      isTutorialInView = true;

      const { default: Tutorial } = await tutorial.importComponent();
      return <Tutorial {...tutorial} />;
    });

    disposables.push(
      // Handle sidebar page changes
      PgView.onDidChangeSidebarPage((page) => {
        if (page.name === "Tutorials") {
          PgTutorial.openAboutPage();
        } else {
          const started = PgTutorial.isStarted(tutorial.name);
          if (started) PgTutorial.open(tutorial.name);
          else PgRouter.navigate();
        }
      }),

      // Handle workspace switch
      PgExplorer.onDidSwitchWorkspace(() => {
        const name = PgExplorer.currentWorkspaceName;
        if (!name || name === tutorial.name) return;

        if (PgTutorial.isWorkspaceTutorial(name)) PgTutorial.open(name);
        else PgRouter.navigate();
      }),

      // Set the main secondary view height to the previous saved value
      { dispose: () => PgView.setMainSecondaryHeight(mainSecondaryHeight) },

      // Set `isTutorialInView` to its default value
      { dispose: () => (isTutorialInView = false) }
    );
  }

  // Open the correct sidebar page
  PgView.setSidebarPage((sidebar) => {
    if (!page) return "Tutorials";
    return sidebar === "Tutorials" ? "Explorer" : sidebar;
  });

  // Minimize secondary main view and reopen on navigation to other routes
  PgView.setMainSecondaryHeight((h) => {
    if (page) {
      // TODO: Remove hardcoded value
      if (h > 36) mainSecondaryHeight = h;
      return mainSecondaryHeight;
    }
    return 0;
  });

  return {
    dispose: () => {
      // If the new path is still the same tutorial, return early without
      // disposing anything
      try {
        const newParams = PgRouter.getParamsFromPath(
          tutorials.path,
          PgRouter.location.pathname
        );
        if (newParams.name === name) return;
      } catch {}

      // Dispose all disposables and clear it
      disposables.forEach(({ dispose }) => dispose());
      disposables = [];
    },
  };
};
