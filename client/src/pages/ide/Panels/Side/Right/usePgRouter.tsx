import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Tutorials from "../../Main/MainView/Tutorials";
import { Route } from "../../../../../constants";
import {
  PgCommon,
  PgExplorer,
  PgRouter,
  PgShare,
  PgTutorial,
  PgView,
  Sidebar,
} from "../../../../../utils/pg";
import { useAsyncEffect } from "../../../../../hooks";

export const usePgRouter = () => {
  const [loading, setLoading] = useState(true);

  const { pathname } = useLocation();

  // Initialize PgExplorer
  useAsyncEffect(async () => {
    try {
      // Default
      if (PgRouter.comparePaths(pathname, Route.DEFAULT)) {
        // Initialize explorer
        await PgExplorer.init();

        // Don't change the UI to avoid flickering if the current workspace is
        // a tutorial but the user is on route `/`
        if (!PgTutorial.isCurrentWorkspaceTutorial()) {
          // Set sidebar
          PgView.setSidebarState((state) => {
            if (state === Sidebar.TUTORIALS) return Sidebar.EXPLORER;
            return state;
          });

          // Set main view
          PgView.setMain();
        }
      }

      // Tutorials page
      else if (PgRouter.comparePaths(pathname, Route.TUTORIALS)) {
        // Initialize explorer
        await PgExplorer.init();

        // Set sidebar
        PgView.setSidebarState(Sidebar.TUTORIALS);

        // Set main view
        PgView.setMain(Tutorials);
      }

      // Tutorial
      else if (pathname.startsWith(Route.TUTORIALS)) {
        // Get the tutorial
        const tutorial = PgTutorial.getTutorialFromPathname(pathname);

        // Check whether the tutorial exists
        if (!tutorial) {
          PgRouter.navigate();
          return;
        }

        // Initialize explorer
        await PgExplorer.init({ name: tutorial.name });

        // Set the current tutorial
        PgTutorial.setCurrent(tutorial);

        // Set main view
        PgView.setMain(async () => {
          const { default: El } = await tutorial.elementImport();
          return <El {...tutorial} />;
        });
      }

      // Github
      else if (pathname.startsWith(Route.GITHUB)) {
        // Initialize explorer
        await PgExplorer.init();

        // Import the repository
        await PgExplorer.importFromGithub(
          pathname.split(`${Route.GITHUB}/`)?.[1]
        );

        // Navigate to main(will re-run the current function)
        PgRouter.navigate();
      }

      // Shared
      else if (!PgExplorer.isShared && PgShare.isValidPathname(pathname)) {
        // Get the share data
        const files = await PgShare.get(pathname);

        // Initialize explorer
        await PgExplorer.init({ files });

        // Set sidebar
        PgView.setSidebarState();

        // Set main view
        PgView.setMain();
      }

      // Not found
      else {
        PgRouter.navigate();
      }
    } catch (e: any) {
      console.log(e.message);
      PgRouter.navigate();
    }
  }, [pathname]);

  useEffect(() => {
    const { dispose } = PgView.onDidChangeSidebarState(async (state) => {
      if (state === Sidebar.TUTORIALS) {
        if (PgTutorial.isCurrentWorkspaceTutorial()) {
          PgTutorial.setPageNumber(0);
        } else {
          PgRouter.navigate(Route.TUTORIALS);
        }
      }
    });
    return () => dispose();
  }, []);

  // Check whether the tab state is valid
  // Invalid case: https://github.com/solana-playground/solana-playground/issues/91#issuecomment-1336388179
  useEffect(() => {
    const tabs = PgExplorer.getTabs();
    if (tabs.length && !PgExplorer.getCurrentFile()) {
      PgExplorer.changeCurrentFile(tabs[0].path);
    }
  }, []);

  // Handle loading state
  useEffect(() => {
    const { dispose } = PgExplorer.onDidSwitchWorkspace(async () => {
      if (
        PgExplorer.currentWorkspaceName ||
        PgExplorer.isShared ||
        !PgExplorer.hasWorkspaces()
      ) {
        await PgCommon.sleep(500);
        setLoading(false);
      }
    });
    return () => dispose();
  }, []);

  return { loading };
};
