import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAtom } from "jotai";

import { Route } from "../../../../constants";
import { explorerAtom, refreshExplorerAtom } from "../../../../state";
import {
  PgExplorer,
  PgRouter,
  PgShare,
  PgTutorial,
  PgView,
} from "../../../../utils/pg";
import { Sidebar } from "../sidebar-state";

export const useSetupExplorerAndRouter = () => {
  const [explorer, setExplorer] = useAtom(explorerAtom);
  const [, refreshExplorer] = useAtom(refreshExplorerAtom);

  const [loading, setLoading] = useState(true);

  const { pathname } = useLocation();

  // Initialize explorer
  useEffect(() => {
    if (pathname === "/" || pathname.startsWith(Route.TUTORIALS)) {
      if (explorer && !explorer.isShared) return;
      (async () => {
        try {
          const _explorer = new PgExplorer(refreshExplorer);
          await _explorer.init();

          // If it's a tutorial, navigate to the tutorial's path
          if (
            pathname === "/" &&
            PgTutorial.isWorkspaceTutorial(_explorer.currentWorkspaceName!)
          ) {
            PgTutorial.open(_explorer.currentWorkspaceName!);
          }
          setExplorer(_explorer);
        } catch (e: any) {
          console.log(e.message);
        }
      })();
    } else if (!explorer?.isShared) {
      // Shared project
      (async () => {
        try {
          const explorerData = await PgShare.get(pathname);
          setExplorer(new PgExplorer(refreshExplorer, explorerData));
        } catch {
          // Couldn't get the data
          // Redirect to main
          PgRouter.navigate("/");
        }
      })();
    }
  }, [explorer, pathname, setExplorer, refreshExplorer]);

  // Handle workspace change
  useEffect(() => {
    if (!explorer) return;

    const initWorkspace = explorer.onDidChangeWorkspace(async () => {
      if (!explorer.currentWorkspaceName) return;

      // If it's a tutorial, navigate to the tutorial's path
      if (PgTutorial.isWorkspaceTutorial(explorer.currentWorkspaceName)) {
        PgTutorial.open(explorer.currentWorkspaceName);
      } else {
        PgRouter.navigate("/");
      }
    });

    return () => {
      initWorkspace.dispose();
    };
  }, [explorer]);

  // Handle sidebar state change
  useEffect(() => {
    PgView.onDidChangeSidebarState(async (sidebarState) => {
      const pathname = await PgRouter.getPath();
      if (
        sidebarState === Sidebar.TUTORIALS &&
        !pathname.startsWith(Route.TUTORIALS)
      ) {
        PgRouter.navigate(Route.TUTORIALS);
      } else if (
        sidebarState !== Sidebar.TUTORIALS &&
        (pathname === Route.TUTORIALS ||
          !(await PgTutorial.isCurrentWorkspaceTutorial()))
      ) {
        PgRouter.navigate("/");
      }
    });
  }, []);

  useEffect(() => {
    if (explorer) setLoading(false);
  }, [explorer]);

  return { loading };
};
