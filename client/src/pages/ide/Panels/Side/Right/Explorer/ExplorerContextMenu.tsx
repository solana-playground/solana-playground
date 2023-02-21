import { FC, MouseEvent, useEffect, useRef } from "react";

import Menu from "../../../../../../components/Menu";
import {
  NewFile,
  NewFolder,
  Rename,
  RunAll,
  TestTube,
  TestPaper,
  Trash,
  Triangle,
  Wrench,
} from "../../../../../../components/Icons";
import { PgExplorer } from "../../../../../../utils/pg";
import { ItemData } from "./useExplorerContextMenu";

interface ExplorerContextMenuProps {
  itemData: ItemData;
  ctxNewItem: () => void;
  renameItem: () => void;
  deleteItem: () => void;
  runBuild: () => void;
  runClient: () => void;
  runClientFolder: () => void;
  runTest: () => void;
  runTestFolder: () => void;
  handleMenu: (e: MouseEvent<HTMLDivElement>) => void;
}

const ExplorerContextMenu: FC<ExplorerContextMenuProps> = ({
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle ctx selected if user clicks outside of the context wrapper
  useEffect(() => {
    const handleClick = (e: globalThis.MouseEvent) => {
      if (e.target && !wrapperRef.current?.contains(e.target as Node)) {
        PgExplorer.removeCtxSelectedEl();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef}>
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
            Icon: <Rename />,
          },
          {
            name: "Delete",
            onClick: deleteItem,
            keybind: "Del",
            Icon: <Trash />,
            kind: "error",
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
        beforeShowCb={handleMenu}
      >
        {children}
      </Menu>
    </div>
  );
};

export default ExplorerContextMenu;
