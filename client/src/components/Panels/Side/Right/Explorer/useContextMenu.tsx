import {
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAtom } from "jotai";

import {
  DATA_DELETE,
  DATA_NEW_FILE,
  DATA_NEW_FOLDER,
  DATA_RENAME,
  Position,
} from "./ContextMenu";
import { ctxSelectedAtom, modalAtom, newItemAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg/explorer";
import RenameItem from "./RenameItem";
import DeleteItem from "./DeleteItem";
import { ClassNames } from "../../../../../constants/";

interface MenuState {
  show: boolean;
  isFolder: boolean;
  position: Position;
}

const useContextMenu = (explorerRef: RefObject<HTMLDivElement>) => {
  const [, setEl] = useAtom(newItemAtom);
  const [, setCtxSelected] = useAtom(ctxSelectedAtom);
  const [, setModal] = useAtom(modalAtom);

  const [menuState, setMenuState] = useState<MenuState>({
    show: false,
    isFolder: false,
    position: { x: 0, y: 0 },
  });

  const handleMenu = useCallback((e: globalThis.MouseEvent) => {
    e.preventDefault();

    // Add selected style to the item
    let itemEl = e.target as Node;
    while (itemEl.nodeName !== "DIV") {
      itemEl = itemEl.parentNode!;
    }

    // Root dir is now allowed to be selected, as it cannot be renamed or deleted
    if ((itemEl as Element).id === "root-dir") return;

    const itemType = PgExplorer.getItemTypeFromEl(itemEl as HTMLDivElement);

    if (!itemType) return;

    setMenuState({
      show: true,
      isFolder: itemType.folder ?? false,
      position: { x: e.pageX, y: e.pageY },
    });

    (itemEl as Element).classList.add(ClassNames.CTX_SELECTED);
  }, []);

  useEffect(() => {
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
        removeCtxSelected();
        // Update ui
        setMenuState((ms) => ({ ...ms, show: false }));
      }
    },
    [setMenuState]
  );

  const clickMenu = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const ctxSelected = getCtxSelected();

      const path = PgExplorer.getItemPathFromEl(ctxSelected as HTMLDivElement);

      const value = e.currentTarget.getAttribute("data-value");

      if (path) {
        if (value === DATA_NEW_FILE || value === DATA_NEW_FOLDER) {
          // If ctx-selected folder is not open, open it
          if (!ctxSelected.classList.contains(ClassNames.OPEN)) {
            ctxSelected.classList.add(ClassNames.OPEN);
            ctxSelected.nextElementSibling!.classList.remove(ClassNames.HIDDEN);
          }
          setEl(ctxSelected.nextElementSibling);
          setCtxSelected(ctxSelected);
        } else if (value === DATA_RENAME)
          setModal({ show: true, JSX: <RenameItem path={path} /> });
        else if (value === DATA_DELETE)
          setModal({ show: true, JSX: <DeleteItem path={path} /> });

        // Remove ctx-selected class
        removeCtxSelected();
        // Remove menu
        setMenuState((ms) => ({ ...ms, show: false }));
      }
    },
    [setMenuState, setEl, setCtxSelected, setModal]
  );

  useEffect(() => {
    if (menuState.show)
      document.body.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.body.removeEventListener("mousedown", handleClickOutside);
  }, [menuState.show, handleClickOutside]);

  return { menuState, menuRef, clickMenu };
};

const getCtxSelected = () => {
  return document.getElementsByClassName(ClassNames.CTX_SELECTED)[0];
};

const removeCtxSelected = () => {
  getCtxSelected().classList.remove(ClassNames.CTX_SELECTED);
};

export default useContextMenu;
