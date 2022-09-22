import { FC, MouseEvent } from "react";
import styled, { css } from "styled-components";

import ContextMenu from "../../../../ContextMenu";
import { ItemData } from "./useExplorerContextMenu";

type Fn = () => void;

interface ExplorerContextMenuProps {
  ctxNewItem: Fn;
  renameItem: Fn;
  deleteItem: Fn;
  runBuild: Fn;
  runClient: Fn;
  runClientFolder: Fn;
  runTest: Fn;
  runTestFolder: Fn;
  itemData: ItemData;
}

const ExplorerContextMenu: FC<ExplorerContextMenuProps> = ({
  ctxNewItem,
  renameItem,
  deleteItem,
  runBuild,
  runClient,
  runClientFolder,
  runTest,
  runTestFolder,
  itemData,
}) => (
  <ContextMenu>
    {itemData.isFolder && (
      <>
        <StyledItem name="New File" keybind="ALT+N" onClick={ctxNewItem} />
        <StyledItem name="New Folder" keybind="ALT+N" onClick={ctxNewItem} />
      </>
    )}
    <StyledItem name="Rename" keybind="F2" onClick={renameItem} />
    <StyledItem name="Delete" keybind="Del" onClick={deleteItem} />
    {itemData.isProgramFolder && <StyledItem name="Build" onClick={runBuild} />}
    {itemData.isClient && <StyledItem name="Run" onClick={runClient} />}
    {itemData.isClientFolder && (
      <StyledItem name="Run All" onClick={runClientFolder} />
    )}
    {itemData.isTest && <StyledItem name="Test" onClick={runTest} />}
    {itemData.isTestFolder && (
      <StyledItem name="Test All" onClick={runTestFolder} />
    )}
  </ContextMenu>
);

interface ItemProps {
  name: string;
  keybind?: string;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

const Item: FC<ItemProps> = ({ name, keybind, onClick, className }) => {
  return (
    <div className={className} onClick={onClick}>
      <span>{name}</span>
      {keybind && <span>{keybind}</span>}
    </div>
  );
};

const StyledItem = styled(Item)`
  ${({ theme }) => css`
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: ${theme.font?.size.small};

    &:hover {
      cursor: pointer;
      background-color: ${theme.colors.default.primary +
      theme.transparency?.medium};
    }

    & span:nth-child(2) {
      color: ${theme.colors.default.textSecondary};
    }
  `}
`;

export default ExplorerContextMenu;
