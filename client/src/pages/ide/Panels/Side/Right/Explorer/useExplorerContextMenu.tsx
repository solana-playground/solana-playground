import { MouseEvent, useCallback, useState } from "react";
import { useAtom } from "jotai";

import { DeleteItem, RenameItem } from "./Modals";
import { ClassName, Id } from "../../../../../../constants";
import { ctxSelectedAtom, newItemAtom } from "../../../../../../state";
import { PgExplorer, PgTerminal, PgView } from "../../../../../../utils/pg";

export type ItemData = {
  [K in
    | "isFolder"
    | "isClient"
    | "isClientFolder"
    | "isTest"
    | "isTestFolder"
    | "isProgramFolder"]?: boolean;
};

const useExplorerContextMenu = () => {
  const [, setEl] = useAtom(newItemAtom);
  const [, setCtxSelected] = useAtom(ctxSelectedAtom);

  const [itemData, setItemData] = useState<ItemData>({});
  const [ctxSelectedPath, setCtxSelectedPath] = useState("");

  const handleMenu = useCallback((e: MouseEvent<HTMLDivElement>) => {
    // Add selected style to the item
    let itemEl = e.target as Node;
    while (itemEl.nodeName !== "DIV") {
      itemEl = itemEl.parentNode!;
    }

    // Root dir is not allowed to be selected as it cannot be renamed or deleted
    if ((itemEl as Element).id === Id.ROOT_DIR) {
      throw new Error();
    }

    const itemType = PgExplorer.getItemTypeFromEl(itemEl as HTMLDivElement);
    if (!itemType) {
      throw new Error();
    }

    const itemPath = PgExplorer.getItemPathFromEl(itemEl as HTMLDivElement)!;
    const itemName = PgExplorer.getItemNameFromPath(itemPath);

    const itemData: ItemData = {
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
    };

    // Convert the `undefined` values to `false` in order to show them only
    // when necessary. (`undefined` defaults to `true` for `showCondition`)
    for (const key in itemData) {
      if (itemData[key as keyof typeof itemData] === undefined) {
        itemData[key as keyof typeof itemData] = false;
      }
    }
    setItemData(itemData);

    PgExplorer.setCtxSelectedEl(itemEl as HTMLDivElement);
    setCtxSelectedPath(
      PgExplorer.getItemPathFromEl(itemEl as HTMLDivElement) ?? ""
    );
  }, []);

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
  }, [getPath, setEl, setCtxSelected]);

  const renameItem = useCallback(async () => {
    if (PgExplorer.getCtxSelectedEl()) {
      await PgView.setModal(<RenameItem path={getPath()} />);
    }
  }, [getPath]);

  const deleteItem = useCallback(async () => {
    if (PgExplorer.getCtxSelectedEl()) {
      await PgView.setModal(<DeleteItem path={getPath()} />);
    }
  }, [getPath]);

  const runClient = useCallback(async () => {
    PgTerminal.COMMANDS.run(getPath());
  }, [getPath]);

  const runTest = useCallback(async () => {
    await PgTerminal.COMMANDS.test(getPath());
  }, [getPath]);

  const runClientFolder = useCallback(async () => {
    await PgTerminal.COMMANDS.run();
  }, []);

  const runTestFolder = useCallback(async () => {
    await PgTerminal.COMMANDS.test();
  }, []);

  const runBuild = useCallback(async () => {
    await PgTerminal.COMMANDS.build();
  }, []);

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
