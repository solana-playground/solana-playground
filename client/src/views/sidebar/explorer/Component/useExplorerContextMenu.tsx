import { MouseEvent, useCallback, useState } from "react";

import { DeleteItem, RenameItem } from "./Modals";
import {
  PgCommand,
  PgCommon,
  PgExplorer,
  PgGlobal,
  PgLanguage,
  PgView,
} from "../../../../utils/pg";
import { useRenderOnChange } from "../../../../hooks";

export type ItemData = {
  [K in
    | "isFolder"
    | "isProgramFolder"
    | "isClient"
    | "isClientFolder"
    | "isTest"
    | "isTestFolder"]?: boolean;
};

export const useExplorerContextMenu = () => {
  const [itemData, setItemData] = useState<ItemData>({});
  const [ctxSelectedPath, setCtxSelectedPath] = useState("");

  const deployState = useRenderOnChange(
    PgGlobal.onDidChangeDeployState,
    PgGlobal.deployState
  );

  const handleMenu = useCallback((ev: MouseEvent<HTMLDivElement>) => {
    // Add selected style to the item
    let itemEl = ev.target as Node;
    while (itemEl.nodeName !== "DIV") {
      itemEl = itemEl.parentNode!;
    }
    const selectedEl = itemEl as HTMLDivElement;

    // Root dir is not allowed to be selected as it cannot be renamed or deleted
    if (selectedEl.id === PgView.ids.ROOT_DIR) throw new Error();

    const itemType = PgExplorer.getItemTypeFromEl(selectedEl);
    if (!itemType) throw new Error();

    const itemPath = PgExplorer.getItemPathFromEl(selectedEl)!;
    const itemName = PgExplorer.getItemNameFromPath(itemPath);

    const itemData: ItemData = {
      isFolder: itemType.folder,
      isProgramFolder:
        itemType.folder && itemName === PgExplorer.PATHS.SRC_DIRNAME,
      isClient:
        itemType.file &&
        PgLanguage.getIsPathJsLike(itemPath) &&
        !itemPath.includes(".test"),
      isClientFolder:
        itemType.folder && itemName === PgExplorer.PATHS.CLIENT_DIRNAME,
      isTest:
        itemType.file &&
        PgLanguage.getIsPathJsLike(itemPath) &&
        itemPath.includes(".test"),
      isTestFolder:
        itemType.folder && itemName === PgExplorer.PATHS.TESTS_DIRNAME,
    };

    // Convert the `undefined` values to `false` in order to show them only
    // when necessary. (`undefined` defaults to `true` for `showCondition`)
    for (const key of PgCommon.keys(itemData)) {
      itemData[key] ??= false;
    }
    setItemData(itemData);

    const ctxPath = PgExplorer.getItemPathFromEl(selectedEl);
    if (ctxPath) setCtxSelectedPath(ctxPath);
    PgExplorer.setCtxSelectedEl(selectedEl);
  }, []);

  const getPath = useCallback(() => {
    if (!ctxSelectedPath) {
      return PgExplorer.getItemPathFromEl(PgExplorer.getSelectedEl()!)!;
    }

    return ctxSelectedPath;
  }, [ctxSelectedPath]);

  // Functions
  const ctxNewItem = useCallback(() => {
    const ctxSelected = PgExplorer.getElFromPath(getPath())!;
    if (!ctxSelected.classList.contains(PgView.classNames.OPEN)) {
      ctxSelected.classList.add(PgView.classNames.OPEN);
      ctxSelected.nextElementSibling?.classList.remove(
        PgView.classNames.HIDDEN
      );
    }

    PgView.setNewItemPortal(ctxSelected.nextElementSibling);
    setTimeout(() => PgExplorer.setCtxSelectedEl(ctxSelected));
  }, [getPath]);

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

  const addProgram = useCallback(async () => {
    await PgExplorer.createItem(
      PgCommon.joinPaths(PgExplorer.PATHS.SRC_DIRNAME, "lib.rs")
    );
  }, []);

  const addClient = useCallback(async () => {
    await PgCommand.run.execute();
  }, []);

  const addTests = useCallback(async () => {
    await PgCommand.test.execute();
  }, []);

  const runBuild = useCallback(async () => {
    await PgCommand.build.execute();
  }, []);

  const runDeploy = useCallback(async () => {
    await PgCommand.deploy.execute();
  }, []);

  const runClient = useCallback(async () => {
    await PgCommand.run.execute(getPath());
  }, [getPath]);

  const runTest = useCallback(async () => {
    await PgCommand.test.execute(getPath());
  }, [getPath]);

  const runClientFolder = useCallback(async () => {
    await PgCommand.run.execute();
  }, []);

  const runTestFolder = useCallback(async () => {
    await PgCommand.test.execute();
  }, []);

  return {
    handleMenu,
    ctxNewItem,
    renameItem,
    deleteItem,
    addProgram,
    addClient,
    addTests,
    runBuild,
    runDeploy,
    runClient,
    runTest,
    runClientFolder,
    runTestFolder,
    itemData,
    deployState,
  };
};
