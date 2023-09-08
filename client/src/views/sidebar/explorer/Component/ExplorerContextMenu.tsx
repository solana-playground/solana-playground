import { FC, MouseEvent, useCallback, useRef } from "react";

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
import { Id } from "../../../../constants";
import { Fn, PgExplorer } from "../../../../utils/pg";
import { ItemData } from "./useExplorerContextMenu";
import { useOnClickOutside } from "../../../../hooks";

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
  handleMenu: (e: MouseEvent<HTMLDivElement>) => void;
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle ctx selected if user clicks outside of the context wrapper
  useOnClickOutside(wrapperRef, PgExplorer.removeCtxSelectedEl);

  const beforeShowCb = useCallback(
    (ev: MouseEvent<HTMLDivElement>) => {
      document.getElementById(Id.SIDE_RIGHT)!.style.overflowY = "visible";
      handleMenu(ev);
    },
    [handleMenu]
  );

  const onHide = useCallback(() => {
    document.getElementById(Id.SIDE_RIGHT)!.style.overflowY = "auto";
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
        beforeShowCb={beforeShowCb}
        onHide={onHide}
      >
        {children}
      </Menu>
    </div>
  );
};
