import { useEffect, useState } from "react";

import { EventName } from "../../../../../constants";
import {
  PgCommon,
  PgExplorer,
  PgRouter,
  PgTutorial,
} from "../../../../../utils/pg";
import { useSetStatic } from "../../../../../hooks";

export const useWorkspace = () => {
  const [loading, setLoading] = useState(true);

  useSetStatic(setLoading, EventName.VIEW_SIDEBAR_LOADING_SET);

  // Handle loading state
  useEffect(() => {
    const { dispose } = PgExplorer.onDidInit(async () => {
      // Check whether the tab state is valid
      // Invalid case: https://github.com/solana-playground/solana-playground/issues/91#issuecomment-1336388179
      const tabs = PgExplorer.getTabs();
      if (tabs.length && !PgExplorer.getCurrentFile()) {
        PgExplorer.changeCurrentFile(tabs[0].path);
      }

      await PgCommon.sleep(300);
      setLoading(false);
    });
    return () => dispose();
  }, []);

  // Handle workspace switch
  useEffect(() => {
    const { dispose } = PgExplorer.onDidSwitchWorkspace(async () => {
      const name = PgExplorer.currentWorkspaceName;
      if (!name) {
        PgRouter.navigate();
        return;
      }

      const { pathname } = await PgRouter.getLocation();
      if (PgRouter.isPathsEqual(pathname, "/tutorials")) return;

      if (PgTutorial.isWorkspaceTutorial(name)) {
        await PgTutorial.open(name);
      } else {
        PgExplorer.setWorkspaceName(name);
        await PgRouter.navigate();
      }
    });
    return () => dispose();
  }, []);

  return { loading };
};
