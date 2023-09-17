import { FC, MouseEvent, useRef } from "react";

import Menu from "../../../../components/Menu";
import {
  Edit,
  NewFile,
  NewFolder,
  RunAll,
  TestPaper,
  TestTube,
  Trash,
  Triangle,
  Wrench,
} from "../../../../components/Icons";
import { Fn, PgExplorer } from "../../../../utils/pg";
import { ItemData } from "./useExplorerContextMenu";

interface ExplorerContextMenuProps {
  itemData: ItemData;
  ctxNewItem: Fn;
  renameItem: Fn;
  deleteItem: Fn;
  runBuild: Fn;
  runClient: Fn;
  runClientFolder: Fn;
  runTest: Fn;
  runTestFolder: Fn;
  handleMenu: (ev: MouseEvent<HTMLDivElement>) => void;
}

export const ExplorerContextMenu: FC<ExplorerContextMenuProps> = ({
  itemData,
  ctxNewItem,
  renameItem,
  deleteItem,
  runBuild,
  runClient,
  runClientFolder,
  runTest,
  runTestFolder,
  handleMenu,
  children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <Menu
      menuRef={menuRef}
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
