import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import { contextMenuStateAtom } from "../../state";
import { PgExplorer } from "../../utils/pg";

const useContextMenu = () => {
  const [menuState, setMenuState] = useAtom(contextMenuStateAtom);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // After menu is opened
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        // Remove ctx-selected class
        PgExplorer.removeCtxSelectedEl();
        // Update ui
        setMenuState((ms) => ({ ...ms, show: false }));
      }
    };

    // Close context-menu on ESC
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        PgExplorer.removeCtxSelectedEl();
        setMenuState((ms) => ({ ...ms, show: false }));
      }
    };

    if (menuState.show) {
      document.body.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKey);
    }

    return () => {
      document.body.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuState.show, setMenuState]);

  return { menuState, setMenuState, menuRef };
};

export default useContextMenu;
