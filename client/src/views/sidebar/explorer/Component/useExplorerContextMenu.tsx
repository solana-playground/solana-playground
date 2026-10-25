import { MouseEvent, useCallback, useState } from "react";

import { DeleteItem, RenameItem } from "./Modals";
import {
  PgCommand,
  PgCommon,
  PgExplorer,
  PgGlobal,
  PgLanguage,
  PgView,
} from "../../../../utils";
import { useRenderOnChange } from "../../../../hooks";

export type ItemData = {
  [K in typeof DATA_KEYS[number]]?: boolean;
};

const DATA_KEYS = [
  "canRename",
  "canDelete",
  "isFolder",
  "isProgramFolder",
  "isClient",
  "isClientFolder",
  "isTest",
  "isTestFolder",
] as const;

export const useExplorerContextMenu = () => {
  const buildLoading = useRenderOnChange(PgGlobal.onDidChangeBuildLoading);
  const deployState = useRenderOnChange(PgGlobal.onDidChangeDeployState);

  const [itemData, setItemData] = useState<ItemData>({});
  const [ctxSelectedPath, setCtxSelectedPath] = useState("");

  const setItemDataOptional = useCallback((itemData: ItemData) => {
    // Convert the `undefined` values to `false` in order to show them only
    // when necessary. (`undefined` defaults to `true` for `showCondition`)
    for (const key of DATA_KEYS) itemData[key] ??= false;
    setItemData(itemData);
  }, []);

  const handleMenu = useCallback(
    (ev: MouseEvent<HTMLDivElement>) => {
      // Add selected style to the item
      let itemEl = ev.target as Node;
      while (itemEl.nodeName !== "DIV") {
        itemEl = itemEl.parentNode!;
      }
      const selectedEl = itemEl as HTMLDivElement;

      // Root dir is not allowed to be selected as it cannot be renamed or deleted
      if (selectedEl.id === PgView.ids.ROOT_DIR) throw new Error();

      const itemType = PgExplorer.getItemTypeFromEl(selectedEl);
      if (!itemType) {
        // Filler section has been clicked
        setItemDataOptional({ isFolder: true });
        return;
      }

      const itemPath = PgExplorer.getItemPathFromEl(selectedEl)!;
      const itemName = PgExplorer.getItemNameFromPath(itemPath);

      setItemDataOptional({
        canRename: true,
        // Can't delete `src` currently but let the deletion logic decide that
        canDelete: true,
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
      });

      const ctxPath = PgExplorer.getItemPathFromEl(selectedEl);
      if (ctxPath) setCtxSelectedPath(ctxPath);
      PgExplorer.setCtxSelectedEl(selectedEl);
    },
    [setItemDataOptional]
  );

  const getPath = useCallback(() => {
    if (!ctxSelectedPath) {
      return PgExplorer.getItemPathFromEl(PgExplorer.getSelectedEl()!)!;
    }

    return ctxSelectedPath;
  }, [ctxSelectedPath]);

  // Functions
  const createItem = useCallback(() => {
    const ctxSelected = PgExplorer.getElFromPath(getPath());
    if (!ctxSelected) {
      // Create under project root
      const projectRootFolderEl = PgExplorer.getProjectRootFolderEl();
      PgView.setNewItemPortal(projectRootFolderEl);
      return;
    }

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
    createItem,
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
    buildLoading,
    deployState,
  };
};
