import { FC, MouseEvent, RefObject } from "react";
import styled, { css } from "styled-components";

import useContextMenu from "./useContextMenu";

export const DATA_NEW_FILE = "new-file";
export const DATA_NEW_FOLDER = "new-folder";
export const DATA_RENAME = "rename";
export const DATA_DELETE = "delete";

export interface Position {
  x: number;
  y: number;
}

interface ContextMenuProps {
  explorerRef: RefObject<HTMLDivElement>;
}

const ContextMenu: FC<ContextMenuProps> = ({ explorerRef }) => {
  const { menuState, clickMenu, menuRef } = useContextMenu(explorerRef);

  return menuState.show ? (
    <Wrapper
      ref={menuRef}
      x={menuState.position.x}
      y={menuState.position.y}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menuState.isFolder && (
        <>
          <StyledItem
            name="New File"
            onClick={clickMenu}
            dataValue={DATA_NEW_FILE}
          />
          <StyledItem
            name="New Folder"
            onClick={clickMenu}
            dataValue={DATA_NEW_FOLDER}
          />
        </>
      )}
      <StyledItem
        name="Rename"
        keybind="F2"
        onClick={clickMenu}
        dataValue={DATA_RENAME}
      />
      <StyledItem
        name="Delete"
        keybind="Del"
        onClick={clickMenu}
        dataValue={DATA_DELETE}
      />
    </Wrapper>
  ) : null;
};

const Wrapper = styled.div<Position>`
  ${({ x, y, theme }) => css`
    position: absolute;
    top: ${y}px;
    left: ${x}px;
    background-color: ${theme.colors.default.bg};
    border: 1px solid ${theme.colors.default.borderColor};
    width: 10rem;
    z-index: 2;
  `}
`;

interface ItemProps {
  name: string;
  keybind?: string;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  dataValue: string;
  className?: string;
}

const Item: FC<ItemProps> = ({
  name,
  keybind,
  onClick,
  dataValue,
  className,
}) => {
  return (
    <div className={className} onClick={onClick} data-value={dataValue}>
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
