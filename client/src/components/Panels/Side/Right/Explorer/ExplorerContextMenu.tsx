import { FC, MouseEvent } from "react";
import styled, { css } from "styled-components";

import ContextMenu from "../../../../ContextMenu";

interface ExplorerContextMenuProps {
  ctxNewItem: () => void;
  renameItem: () => void;
  deleteItem: () => void;
  isFolder: boolean;
}

const ExplorerContextMenu: FC<ExplorerContextMenuProps> = ({
  ctxNewItem,
  renameItem,
  deleteItem,
  isFolder,
}) => (
  <ContextMenu>
    {isFolder && (
      <>
        <StyledItem name="New File" keybind="ALT+N" onClick={ctxNewItem} />
        <StyledItem name="New Folder" keybind="ALT+N" onClick={ctxNewItem} />
      </>
    )}
    <StyledItem name="Rename" keybind="F2" onClick={renameItem} />
    <StyledItem name="Delete" keybind="Del" onClick={deleteItem} />
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
      font-size: ${theme.font?.size.small};
    }
  `}
`;

export default ExplorerContextMenu;
