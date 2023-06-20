import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Tutorials from "../../Main/MainView/Tutorials";
import EditorWithTabs from "../../Main/MainView/EditorWithTabs";
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
        await PgExplorer.init();
      }

      // Tutorials page
      else if (PgRouter.comparePaths(pathname, Route.TUTORIALS)) {
        await PgExplorer.init();
        PgView.setSidebarState(Sidebar.TUTORIALS);
      }

      // Tutorial
      else if (pathname.startsWith(Route.TUTORIALS)) {
        const tutorial = PgTutorial.getTutorialFromPathname(pathname);
        if (!tutorial) {
          PgRouter.navigate(Route.DEFAULT);
          return;
        }

        await PgExplorer.init({ name: tutorial.name });
      }

      // Github
      else if (pathname.startsWith(Route.GITHUB)) {
        await PgExplorer.init();

        // Import the repository
        await PgExplorer.importFromGithub(
          pathname.split(`${Route.GITHUB}/`)?.[1]
        );
        // Navigate to main(will re-run current function)
        PgRouter.navigate(Route.DEFAULT);
      }

      // Shared
      else if (!PgExplorer.isShared && PgShare.isValidPathname(pathname)) {
        const files = await PgShare.get(pathname);
        await PgExplorer.init({ files });

        PgView.setSidebarState(Sidebar.EXPLORER);
      }

      // Not found
      else {
        PgRouter.navigate(Route.DEFAULT);
      }
    } catch (e: any) {
      console.log(e.message);
      PgRouter.navigate(Route.DEFAULT);
    }
  }, [pathname]);

  // Handle workspace switch
  useEffect(() => {
    const { dispose } = PgExplorer.onDidSwitchWorkspace(() => {
      if (!PgExplorer.currentWorkspaceName) return;

      // If it's a tutorial, navigate to the tutorial's path
      if (PgTutorial.isWorkspaceTutorial(PgExplorer.currentWorkspaceName)) {
        PgTutorial.open(PgExplorer.currentWorkspaceName);
      } else {
        PgRouter.navigate(Route.DEFAULT);
      }
    });
    return () => dispose();
  }, []);

  // Handle sidebar state change
  useEffect(() => {
    const disposable = PgView.onDidChangeSidebarState(async (sidebarState) => {
      const { pathname } = await PgRouter.getLocation();
      if (
        sidebarState === Sidebar.TUTORIALS &&
        !pathname.startsWith(Route.TUTORIALS)
      ) {
        PgRouter.navigate(Route.TUTORIALS);
      } else if (sidebarState !== Sidebar.TUTORIALS && !PgExplorer.isShared) {
        const tutorial = PgTutorial.getTutorialFromPathname(pathname);
        if (!tutorial) {
          PgRouter.navigate(Route.DEFAULT);
        } else if (
          pathname.startsWith(Route.TUTORIALS) &&
          !PgRouter.comparePaths(pathname, Route.TUTORIALS) &&
          PgExplorer.currentWorkspaceName &&
          PgExplorer.currentWorkspaceName !== tutorial.name
        ) {
          if (PgExplorer.allWorkspaceNames?.includes(tutorial.name)) {
            await PgTutorial.open(tutorial.name);
          } else {
            await PgRouter.navigate(Route.DEFAULT);
          }
        }
      }
    });

    return () => disposable.dispose();
  }, []);

  // Handle MainView
  useAsyncEffect(async () => {
    if (pathname.startsWith(Route.TUTORIALS)) {
      if (PgRouter.comparePaths(pathname, Route.TUTORIALS)) {
        await PgCommon.sleep(50);
        PgView.setMain(() => <Tutorials />);
      } else {
        const tutorial = PgTutorial.getTutorialFromPathname(pathname);
        if (!tutorial) {
          PgRouter.navigate(Route.TUTORIALS);
          return;
        }

        await PgCommon.sleep(10);
        PgTutorial.setCurrent(tutorial);

        PgView.setMain(async () => {
          const { default: El } = await tutorial.elementImport();
          return <El {...tutorial} />;
        });
      }
    } else if (PgTutorial.isCurrentWorkspaceTutorial()) {
      const tutorialName = PgExplorer.currentWorkspaceName;
      PgTutorial.open(tutorialName!);
    } else {
      PgView.setMain(() => <EditorWithTabs />);
    }
  }, [pathname]);

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
    const { dispose } = PgExplorer.onDidSwitchWorkspace(() => {
      if (
        PgExplorer.currentWorkspaceName ||
        PgExplorer.isShared ||
        !PgExplorer.hasWorkspaces()
      ) {
        setLoading(false);
      }
    });
    return () => dispose();
  }, []);

  return { loading };
};
