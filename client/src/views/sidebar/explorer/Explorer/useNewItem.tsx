import { useCallback } from "react";
import { useAtom } from "jotai";

import { newItemAtom } from "../../../../state";
import { PgExplorer } from "../../../../utils/pg";

export const useNewItem = () => {
  const [, setEl] = useAtom(newItemAtom);

  const newItem = useCallback(() => {
    const selected = PgExplorer.getSelectedEl();

    if (selected) {
      // Open if selected is a folder
      if (PgExplorer.getItemTypeFromEl(selected)?.folder) {
        PgExplorer.openFolder(selected);

        // Make add file visible
        setEl(selected.nextElementSibling);
      } else {
        // Selected is a file
        // The owner folder is parent element's previous sibling
        setEl(selected.parentElement);
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
      setEl(folderInside);
    }
  }, [setEl]);

  return { newItem };
};
