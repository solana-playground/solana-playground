import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";

import { contextMenuStateAtom } from "../../state";
import { PgExplorer } from "../../utils/pg";

const useContextMenu = () => {
  const [menuState, setMenuState] = useAtom(contextMenuStateAtom);

  const menuRef = useRef<HTMLDivElement>(null);

  // After menu is opened
  const handleClickOutside = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        // Remove ctx-selected class
        PgExplorer.removeCtxSelectedEl();
        // Update ui
        setMenuState((ms) => ({ ...ms, show: false }));
      }
    },
    [setMenuState, menuRef]
  );

  useEffect(() => {
    if (menuState.show)
      document.body.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.body.removeEventListener("mousedown", handleClickOutside);
  }, [menuState.show, handleClickOutside]);

  return { menuState, setMenuState, menuRef };
};

export default useContextMenu;
