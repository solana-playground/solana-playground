import { useEffect } from "react";
import { useTheme } from "styled-components";
import { PgCommon, PgExplorer } from "../../../../utils/pg";

/** Manage the item state when the current workspace or file changes. */
export const useHandleItemState = () => {
  const theme = useTheme();

  useEffect(() => {
    const switchWorkspace = PgExplorer.onDidSwitchWorkspace(() => {
      // Reset folder open/closed state
      PgExplorer.collapseAllFolders();
    });

    const openParentsAndSelectEl = (path: string) => {
      // Open if current file's parents are not opened
      PgExplorer.openAllParents(path);

      // Change selected element
      const newEl = PgExplorer.getElFromPath(path);
      if (newEl) {
        PgExplorer.setSelectedEl(newEl);
        PgExplorer.removeCtxSelectedEl();
      }
    };

    const switchFile = PgExplorer.onDidOpenFile(async (file) => {
      if (!file) return;

      openParentsAndSelectEl(file.path);

      // Sleep before opening parents because switching workspace collapses
      // all folders after file switching
      await PgCommon.sleep(300);
      openParentsAndSelectEl(file.path);
    });

    return () => {
      switchWorkspace.dispose();
      switchFile.dispose();
    };

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.name]);
};
