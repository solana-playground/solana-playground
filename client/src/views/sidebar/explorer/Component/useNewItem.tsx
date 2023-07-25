import { useCallback } from "react";

import { PgExplorer, PgView } from "../../../../utils/pg";

export const useNewItem = () => {
  const newItem = useCallback(() => {
    const selected = PgExplorer.getSelectedEl();

    if (selected) {
      // Open if selected is a folder
      if (PgExplorer.getItemTypeFromEl(selected)?.folder) {
        PgExplorer.openFolder(selected);
        PgView.setNewItemPortal(selected.nextElementSibling);
      } else {
        // Selected is a file
        // The owner folder is parent element's previous sibling
        PgView.setNewItemPortal(selected.parentElement);
      }
    } else {
      // Create in the first dir(src)
      const rootEl = PgExplorer.getRootFolderEl();
      const srcFolderEl = rootEl?.children[1];
      if (!srcFolderEl) return;

      PgExplorer.openFolder(srcFolderEl as HTMLDivElement);
      const folderInside = srcFolderEl.nextElementSibling;
      if (!folderInside) return;

      PgExplorer.setSelectedEl(srcFolderEl as HTMLDivElement);
      PgView.setNewItemPortal(folderInside);
    }
  }, []);

  return { newItem };
};
