import { MouseEvent, useCallback, useState } from "react";
import { useAtom } from "jotai";

import { DeleteItem, RenameItem } from "./Modals";
import { ClassName, Id } from "../../../../../constants";
import {
  contextMenuStateAtom,
  ctxSelectedAtom,
  modalAtom,
  newItemAtom,
} from "../../../../../state";
import { PgExplorer, PgTerminal } from "../../../../../utils/pg";

export interface ItemData {
  isFolder?: boolean;
  isClient?: boolean;
  isClientFolder?: boolean;
  isTest?: boolean;
  isTestFolder?: boolean;
  isProgramFolder?: boolean;
}

const useExplorerContextMenu = () => {
  const [, setEl] = useAtom(newItemAtom);
  const [, setCtxSelected] = useAtom(ctxSelectedAtom);
  const [, setModal] = useAtom(modalAtom);
  const [, setMenu] = useAtom(contextMenuStateAtom);

  const [itemData, setItemData] = useState<ItemData>({});
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

      const sideRightCoords = document
        .getElementsByClassName(ClassName.SIDE_RIGHT)[0]
        .getBoundingClientRect();

      const itemType = PgExplorer.getItemTypeFromEl(itemEl as HTMLDivElement);
      if (!itemType) return;

      const itemPath = PgExplorer.getItemPathFromEl(itemEl as HTMLDivElement)!;
      const itemName = PgExplorer.getItemNameFromPath(itemPath);

      setItemData({
        isFolder: itemType.folder,
        isClient:
          itemType.file &&
          PgExplorer.getIsItemClientFromEl(itemEl as HTMLDivElement),
        isClientFolder:
          itemType.folder && itemName === PgExplorer.PATHS.CLIENT_DIRNAME,
        isTest:
          itemType.file &&
          PgExplorer.getIsItemTestFromEl(itemEl as HTMLDivElement),
        isTestFolder:
          itemType.folder && itemName === PgExplorer.PATHS.TESTS_DIRNAME,
        isProgramFolder:
          itemType.folder && itemName === PgExplorer.PATHS.SRC_DIRNAME,
      });
      setMenu({
        show: true,
        position: {
          x: e.pageX - sideRightCoords.x,
          y: e.pageY - sideRightCoords.y,
        },
      });

      PgExplorer.setCtxSelectedEl(itemEl as HTMLDivElement);
      setCtxSelectedPath(
        PgExplorer.getItemPathFromEl(itemEl as HTMLDivElement) ?? ""
      );
    },
    [setMenu]
  );

  const closeMenu = useCallback(() => {
    // Remove ctx-selected class
    PgExplorer.removeCtxSelectedEl();
    // Close menu
    setMenu((m) => ({ ...m, show: false }));
  }, [setMenu]);

  const run = useCallback(
    (cb: () => void) => {
      cb();
      closeMenu();
    },
    [closeMenu]
  );

  const getPath = useCallback(() => {
    return !ctxSelectedPath
      ? PgExplorer.getItemPathFromEl(PgExplorer.getSelectedEl()) ??
          ctxSelectedPath
      : ctxSelectedPath;
  }, [ctxSelectedPath]);

  // Functions
  const ctxNewItem = useCallback(() => {
    run(() => {
      const ctxSelected = PgExplorer.getElFromPath(getPath());

      if (!ctxSelected.classList.contains(ClassName.OPEN)) {
        ctxSelected.classList.add(ClassName.OPEN);
        ctxSelected.nextElementSibling?.classList.remove(ClassName.HIDDEN);
      }
      setEl(ctxSelected.nextElementSibling);
      setCtxSelected(ctxSelected);
    });
  }, [getPath, setEl, setCtxSelected, run]);

  const renameItem = useCallback(() => {
    run(() => {
      if (PgExplorer.getCtxSelectedEl()) {
        const path = getPath();
        setModal(<RenameItem path={path} />);
      }
    });
  }, [getPath, setModal, run]);

  const deleteItem = useCallback(() => {
    run(() => {
      if (PgExplorer.getCtxSelectedEl()) {
        const path = getPath();
        setModal(<DeleteItem path={path} />);
      }
    });
  }, [getPath, setModal, run]);

  const runClient = useCallback(() => {
    run(() => {
      PgTerminal.execute({ run: getPath() });
    });
  }, [getPath, run]);

  const runTest = useCallback(() => {
    run(() => {
      PgTerminal.execute({ test: getPath() });
    });
  }, [getPath, run]);

  const runClientFolder = useCallback(() => {
    run(() => {
      PgTerminal.execute({ run: "" });
    });
  }, [run]);

  const runTestFolder = useCallback(() => {
    run(() => {
      PgTerminal.execute({ test: "" });
    });
  }, [run]);

  const runBuild = useCallback(() => {
    run(() => {
      PgTerminal.execute({ build: "" });
    });
  }, [run]);

  return {
    handleMenu,
    ctxNewItem,
    renameItem,
    deleteItem,
    runClient,
    runTest,
    runClientFolder,
    runTestFolder,
    runBuild,
    itemData,
  };
};

export default useExplorerContextMenu;
