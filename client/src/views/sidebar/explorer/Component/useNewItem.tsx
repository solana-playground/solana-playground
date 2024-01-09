import { useCallback } from "react";

import { PgCommon, PgExplorer, PgView } from "../../../../utils/pg";

export const useNewItem = () => {
  const newItem = useCallback(async () => {
    const selected = PgExplorer.getSelectedEl();

    if (selected) {
      // Open if selected is a folder
      if (PgExplorer.getItemTypeFromEl(selected)?.folder) {
        PgExplorer.openFolder(selected);
        PgView.setNewItemPortal(selected.nextElementSibling);
      } else {
        // Selected is a file
        // Open all parents
        const path = PgExplorer.getItemPathFromEl(selected)!;
        PgExplorer.openAllParents(path);

        // The parent folder is the parent element
        PgView.setNewItemPortal(selected.parentElement);
      }
    } else {
      // Create in the first dir
      const projectRootPath = PgExplorer.getProjectRootPath();
      const { folders } = PgExplorer.getFolderContent(projectRootPath);
      // Create a new `src` dir if there are no folders
      if (!folders.length) {
        await PgExplorer.newItem(PgExplorer.PATHS.SRC_DIRNAME);
        folders.push(PgExplorer.PATHS.SRC_DIRNAME);

        // Sleep to give time for the UI to update
        await PgCommon.sleep(100);
      }

      // Select the first folder(prioritize `src`)
      const folderName =
        folders.find((name) => name === PgExplorer.PATHS.SRC_DIRNAME) ??
        folders[0];
      const folderPath = PgExplorer.getCanonicalPath(folderName);

      const rootFolderEl = PgExplorer.getRootFolderEl()!;
      const divs = rootFolderEl.getElementsByTagName("div");
      for (const div of divs) {
        const path = PgExplorer.getItemPathFromEl(div);
        if (path && PgCommon.isPathsEqual(path, folderPath)) {
          PgExplorer.setSelectedEl(div);
          newItem();
          break;
        }
      }
    }
  }, []);

  return { newItem };
};
