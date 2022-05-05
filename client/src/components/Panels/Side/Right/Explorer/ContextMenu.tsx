import { FC, MouseEvent, RefObject } from "react";
import styled, { css } from "styled-components";

import useExplorerContextMenu from "./useExplorerContextMenu";

export interface Position {
  x: number;
  y: number;
}

interface ContextMenuProps {
  explorerRef: RefObject<HTMLDivElement>;
}

const ContextMenu: FC<ContextMenuProps> = ({ explorerRef }) => {
  const { menuState, menuRef, ctxNewItem, renameItem, deleteItem } =
    useExplorerContextMenu(explorerRef);

  return menuState.show ? (
    <Wrapper
      ref={menuRef}
      x={menuState.position.x}
      y={menuState.position.y}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menuState.isFolder && (
        <>
          <StyledItem name="New File" keybind="ALT+N" onClick={ctxNewItem} />
          <StyledItem name="New Folder" keybind="ALT+N" onClick={ctxNewItem} />
        </>
      )}
      <StyledItem name="Rename" keybind="F2" onClick={renameItem} />
      <StyledItem name="Delete" keybind="Del" onClick={deleteItem} />
    </Wrapper>
  ) : null;
};

const Wrapper = styled.div<Position>`
  ${({ x, y, theme }) => css`
    position: absolute;
    top: ${y}px;
    left: ${x}px;
    background-color: ${theme.colors?.right?.otherBg ??
    theme.colors.default.bg};
    border: 1px solid ${theme.colors.default.borderColor};
    width: 11rem;
    z-index: 2;
  `}
`;

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
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) =>
      theme.colors.default.primary + theme.transparency?.medium};
  }

  & span:nth-child(2) {
    color: ${({ theme }) => theme.colors.default.textSecondary};
    font-size: ${({ theme }) => theme.font?.size.small};
  }
`;

export default ContextMenu;
