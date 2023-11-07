import { FC } from "react";

import Menu from "../../../../components/Menu";
import {
  Edit,
  NewFile,
  NewFolder,
  Rocket,
  RunAll,
  TestPaper,
  TestTube,
  Trash,
  Triangle,
  Wrench,
} from "../../../../components/Icons";
import { PgExplorer } from "../../../../utils/pg";
import type { useExplorerContextMenu } from "./useExplorerContextMenu";

type ExplorerContextMenuProps = ReturnType<typeof useExplorerContextMenu>;

export const ExplorerContextMenu: FC<ExplorerContextMenuProps> = ({
  itemData,
  ctxNewItem,
  renameItem,
  deleteItem,
  runBuild,
  runDeploy,
  runClient,
  runClientFolder,
  runTest,
  runTestFolder,
  handleMenu,
  children,
}) => {
  return (
    <Menu.Context
      items={[
        {
          name: "New File",
          onClick: ctxNewItem,
          keybind: "ALT+N",
          icon: <NewFile />,
          showCondition: itemData.isFolder,
        },
        {
          name: "New Folder",
          onClick: ctxNewItem,
          keybind: "ALT+N",
          icon: <NewFolder />,
          showCondition: itemData.isFolder,
        },
        {
          name: "Rename",
          onClick: renameItem,
          keybind: "F2",
          icon: <Edit />,
        },
        {
          name: "Delete",
          onClick: deleteItem,
          keybind: "Del",
          icon: <Trash />,
          hoverColor: "error",
        },
        {
          name: "Build",
          onClick: runBuild,
          icon: <Wrench />,
          showCondition: itemData.isProgramFolder,
        },
        {
          name: "Deploy",
          onClick: runDeploy,
          icon: <Rocket />,
          showCondition: itemData.isProgramFolder,
        },
        {
          name: "Run",
          onClick: runClient,
          icon: <Triangle rotate="90deg" />,
          showCondition: itemData.isClient,
        },
        {
          name: "Run All",
          onClick: runClientFolder,
          icon: <RunAll />,
          showCondition: itemData.isClientFolder,
        },
        {
          name: "Test",
          onClick: runTest,
          icon: <TestTube />,
          showCondition: itemData.isTest,
        },
        {
          name: "Test All",
          onClick: runTestFolder,
          icon: <TestPaper />,
          showCondition: itemData.isTestFolder,
        },
      ]}
      onContextMenu={handleMenu}
      onHide={PgExplorer.removeCtxSelectedEl}
    >
      {children}
    </Menu.Context>
  );
};
