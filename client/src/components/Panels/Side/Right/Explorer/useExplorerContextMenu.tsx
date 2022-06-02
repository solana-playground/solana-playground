import { MouseEvent, useCallback, useState } from "react";
import { useAtom } from "jotai";

import DeleteItem from "./DeleteItem";
import RenameItem from "./RenameItem";
import { ClassName, Id } from "../../../../../constants";
import {
  contextMenuStateAtom,
  ctxSelectedAtom,
  modalAtom,
  newItemAtom,
} from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg";

const useExplorerContextMenu = () => {
  const [, setEl] = useAtom(newItemAtom);
  const [, setCtxSelected] = useAtom(ctxSelectedAtom);
  const [, setModal] = useAtom(modalAtom);
  const [, setMenu] = useAtom(contextMenuStateAtom);

  const [isFolder, setIsFolder] = useState(false);
  const [ctxSelectedPath, setCtxSelectedPath] = useState("");

  const handleMenu = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
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

      setIsFolder(itemType.folder ?? false);
      setMenu({
        show: true,
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
    [setMenu, setCtxSelectedPath]
  );

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
    setMenu((m) => ({ ...m, show: false }));
  }, [getPath, setEl, setCtxSelected, setMenu]);

  const renameItem = useCallback(() => {
    const path = getPath();
    if (!path) return;

    setModal(<RenameItem path={path} />);

    // Remove ctx-selected class
    PgExplorer.removeCtxSelectedEl();
    // Remove menu
    setMenu((m) => ({ ...m, show: false }));
  }, [getPath, setModal, setMenu]);

  const deleteItem = useCallback(() => {
    const path = getPath();
    if (!path) return;

    setModal(<DeleteItem path={path} />);

    // Remove ctx-selected class
    PgExplorer.removeCtxSelectedEl();
    // Remove menu
    setMenu((m) => ({ ...m, show: false }));
  }, [getPath, setModal, setMenu]);

  return { ctxNewItem, renameItem, deleteItem, handleMenu, isFolder };
};

export default useExplorerContextMenu;
