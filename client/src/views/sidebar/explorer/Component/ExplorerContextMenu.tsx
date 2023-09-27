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
    <Menu
      kind="context"
      items={[
        {
          name: "New File",
          onClick: ctxNewItem,
          keybind: "ALT+N",
          Icon: <NewFile />,
          showCondition: itemData.isFolder,
        },
        {
          name: "New Folder",
          onClick: ctxNewItem,
          keybind: "ALT+N",
          Icon: <NewFolder />,
          showCondition: itemData.isFolder,
        },
        {
          name: "Rename",
          onClick: renameItem,
          keybind: "F2",
          Icon: <Edit />,
        },
        {
          name: "Delete",
          onClick: deleteItem,
          keybind: "Del",
          Icon: <Trash />,
          hoverColor: "error",
        },
        {
          name: "Build",
          onClick: runBuild,
          Icon: <Wrench />,
          showCondition: itemData.isProgramFolder,
        },
        {
          name: "Deploy",
          onClick: runDeploy,
          Icon: <Rocket />,
          showCondition: itemData.isProgramFolder,
        },
        {
          name: "Run",
          onClick: runClient,
          Icon: <Triangle rotate="90deg" />,
          showCondition: itemData.isClient,
        },
        {
          name: "Run All",
          onClick: runClientFolder,
          Icon: <RunAll />,
          showCondition: itemData.isClientFolder,
        },
        {
          name: "Test",
          onClick: runTest,
          Icon: <TestTube />,
          showCondition: itemData.isTest,
        },
        {
          name: "Test All",
          onClick: runTestFolder,
          Icon: <TestPaper />,
          showCondition: itemData.isTestFolder,
        },
      ]}
      onContextMenu={handleMenu}
      onHide={PgExplorer.removeCtxSelectedEl}
    >
      {children}
    </Menu>
  );
};
