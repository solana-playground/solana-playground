import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import EditorWithTabs from "../../Main/MainView/EditorWithTabs";
import Tutorials from "../../Main/MainView/Tutorials";
import { Route } from "../../../../../constants";
import {
  PgCommon,
  PgExplorer,
  PgGithub,
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

  // Handle routes
  useAsyncEffect(async () => {
    try {
      // Default
      if (PgRouter.comparePaths(pathname, Route.DEFAULT)) {
        // Set main view
        PgView.setMain(async () => {
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

            return EditorWithTabs;
          } else {
            // Open the tutorial
            PgTutorial.open(PgExplorer.currentWorkspaceName!);

            // Stop the render of this method by throwing an error
            throw new Error("No need to render");
          }
        });

        // Handle sidebar
        const { dispose } = PgView.onDidChangeSidebarState((state) => {
          if (state === Sidebar.TUTORIALS) {
            PgRouter.navigate(Route.TUTORIALS);
          } else {
            PgRouter.navigate();
          }
        });

        return () => dispose();
      }

      // Tutorials page
      else if (PgRouter.comparePaths(pathname, Route.TUTORIALS)) {
        // Set main view
        PgView.setMain(async () => {
          // Initialize explorer
          await PgExplorer.init();

          // Set sidebar
          PgView.setSidebarState(Sidebar.TUTORIALS);

          return Tutorials;
        });

        // Handle sidebar
        const { dispose } = PgView.onDidChangeSidebarState((state) => {
          if (state === Sidebar.TUTORIALS) {
            if (PgTutorial.isCurrentWorkspaceTutorial()) {
              PgTutorial.setPageNumber(0);
            }
          } else {
            PgRouter.navigate();
          }
        });

        return () => dispose();
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
      }

      // Shared
      else if (PgShare.isValidPathname(pathname)) {
        // Set main view
        PgView.setMain(async () => {
          setLoading(true);

          // Get the share data
          const files = await PgShare.get(pathname.slice(1));

          // Initialize explorer
          await PgExplorer.init({ files });

          // Set sidebar
          PgView.setSidebarState();

          return EditorWithTabs;
        });

        // Handle sidebar
        const { dispose } = PgView.onDidChangeSidebarState((state) => {
          if (state === Sidebar.TUTORIALS) PgRouter.navigate(Route.TUTORIALS);
        });

        return () => dispose();
      }

      // Github
      else if (pathname.startsWith(Route.GITHUB)) {
        PgView.setMain(async () => {
          setLoading(true);

          // Get repository data
          const files = await PgGithub.getExplorerFiles(
            pathname.split(`${Route.GITHUB}/`)?.[1]
          );

          // Initialize explorer
          await PgExplorer.init({ files });

          // Set sidebar
          PgView.setSidebarState();

          return EditorWithTabs;
        });

        // Handle sidebar
        const { dispose } = PgView.onDidChangeSidebarState((state) => {
          if (state === Sidebar.TUTORIALS) PgRouter.navigate(Route.TUTORIALS);
        });

        return () => dispose();
      }

      // Not found
      else {
        PgRouter.navigate();
      }
    } catch (e: any) {
      console.log("ROUTE ERROR:", e.message);
      PgRouter.navigate();
    }
  }, [pathname]);

  // Handle workspace switch
  useEffect(() => {
    const { dispose } = PgExplorer.onDidSwitchWorkspace(async () => {
      const name = PgExplorer.currentWorkspaceName;
      if (!name) {
        PgRouter.navigate();
        return;
      }

      const { pathname } = await PgRouter.getLocation();
      if (PgRouter.comparePaths(pathname, Route.TUTORIALS)) return;

      if (PgTutorial.isWorkspaceTutorial(name)) {
        await PgTutorial.open(name);
      } else {
        PgExplorer.setWorkspaceName(name);
        await PgRouter.navigate();
      }
    });
    return () => dispose();
  }, []);

  // Check whether the tab state is valid
  // Invalid case: https://github.com/solana-playground/solana-playground/issues/91#issuecomment-1336388179
  useEffect(() => {
    if (loading) return;

    const tabs = PgExplorer.getTabs();
    if (tabs.length && !PgExplorer.getCurrentFile()) {
      PgExplorer.changeCurrentFile(tabs[0].path);
    }
  }, [loading]);

  // Handle loading state
  useEffect(() => {
    const { dispose } = PgExplorer.onDidInit(async () => {
      await PgCommon.sleep(300);
      setLoading(false);
    });
    return () => dispose();
  }, []);

  return { loading };
};
