import { useCallback } from "react";

import { PgExplorer, PgView } from "../../../../utils";

export const useCreateItem = () => {
  const createItem = useCallback(async () => {
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
      // Create under project root
      const projectRootFolderEl = PgExplorer.getProjectRootFolderEl();
      PgView.setNewItemPortal(projectRootFolderEl);
    }
  }, []);

  return { createItem };
};
