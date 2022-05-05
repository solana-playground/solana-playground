import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";

import { Position } from "./ContextMenu";
import { ctxSelectedAtom, modalAtom, newItemAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg/explorer";
import RenameItem from "./RenameItem";
import DeleteItem from "./DeleteItem";
import { ClassName, Id } from "../../../../../constants";

interface MenuState {
  show: boolean;
  isFolder: boolean;
  position: Position;
}

const useExplorerContextMenu = (explorerRef?: RefObject<HTMLDivElement>) => {
  const [, setEl] = useAtom(newItemAtom);
  const [, setCtxSelected] = useAtom(ctxSelectedAtom);
  const [, setModal] = useAtom(modalAtom);

  const [menuState, setMenuState] = useState<MenuState>({
    show: false,
    isFolder: false,
    position: { x: 0, y: 0 },
  });
  const [ctxSelectedPath, setCtxSelectedPath] = useState("");

  const handleMenu = useCallback(
    (e: globalThis.MouseEvent) => {
      e.preventDefault();

      // Add selected style to the item
      let itemEl = e.target as Node;
      while (itemEl.nodeName !== "DIV") {
        itemEl = itemEl.parentNode!;
      }

      // Root dir is now allowed to be selected, as it cannot be renamed or deleted
      if ((itemEl as Element).id === Id.ROOT_DIR) return;

      const itemType = PgExplorer.getItemTypeFromEl(itemEl as HTMLDivElement);

      if (!itemType) return;

      const sideRightCoords = document
        .getElementsByClassName(ClassName.SIDE_RIGHT)[0]
        .getBoundingClientRect();

      setMenuState({
        show: true,
        isFolder: itemType.folder ?? false,
        position: {
          x: e.pageX - sideRightCoords.x,
          y: e.pageY - sideRightCoords.y,
        },
      });

      (itemEl as Element).classList.add(ClassName.CTX_SELECTED);
      setCtxSelectedPath(
        PgExplorer.getItemPathFromEl(itemEl as HTMLDivElement) ?? ""
      );
    },
    [setCtxSelectedPath]
  );

  useEffect(() => {
    if (!explorerRef?.current) return;

    const explorerCurrent = explorerRef.current;
    if (explorerCurrent)
      explorerCurrent.addEventListener("contextmenu", handleMenu);

    return () =>
      explorerCurrent?.removeEventListener("contextmenu", handleMenu);
  }, [explorerRef, handleMenu]);

  // After menu is opened
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        // Remove ctx-selected class
        PgExplorer.removeCtxSelectedEl();
        // Update ui
        setMenuState((ms) => ({ ...ms, show: false }));
      }
    },
    [setMenuState]
  );

  useEffect(() => {
    if (menuState.show)
      document.body.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.body.removeEventListener("mousedown", handleClickOutside);
  }, [menuState.show, handleClickOutside]);

  const getPath = useCallback(() => {
    return !ctxSelectedPath
      ? PgExplorer.getItemPathFromEl(PgExplorer.getSelectedEl()) ??
          ctxSelectedPath
      : ctxSelectedPath;
  }, [ctxSelectedPath]);

  // Functions
  const ctxNewItem = useCallback(() => {
    const ctxSelected = PgExplorer.getElFromPath(getPath());

    if (!ctxSelected.classList.contains(ClassName.OPEN)) {
      ctxSelected.classList.add(ClassName.OPEN);
      ctxSelected.nextElementSibling?.classList.remove(ClassName.HIDDEN);
    }
    setEl(ctxSelected.nextElementSibling);
    setCtxSelected(ctxSelected);

    // Remove ctx-selected class
    PgExplorer.removeCtxSelectedEl();
    // Remove menu
    setMenuState((ms) => ({ ...ms, show: false }));
  }, [getPath, setEl, setCtxSelected, setMenuState]);

  const renameItem = useCallback(() => {
    const path = getPath();
    if (!path) return;

    setModal({
      show: true,
      JSX: <RenameItem path={path} />,
    });

    // Remove ctx-selected class
    PgExplorer.removeCtxSelectedEl();
    // Remove menu
    setMenuState((ms) => ({ ...ms, show: false }));
  }, [getPath, setModal, setMenuState]);

  const deleteItem = useCallback(() => {
    const path = getPath();
    if (!path) return;

    setModal({ show: true, JSX: <DeleteItem path={path} /> });

    // Remove ctx-selected class
    PgExplorer.removeCtxSelectedEl();
    // Remove menu
    setMenuState((ms) => ({ ...ms, show: false }));
  }, [getPath, setModal, setMenuState]);

  return { menuState, menuRef, ctxNewItem, renameItem, deleteItem };
};

export default useExplorerContextMenu;
