import { FC, MouseEvent, ReactNode } from "react";
import styled, { css } from "styled-components";

import ContextMenu from "../../../../ContextMenu";
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
} from "../../../../Icons";
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
        <StyledItem
          name="New File"
          keybind="ALT+N"
          IconEl={<NewFile />}
          onClick={ctxNewItem}
        />
        <StyledItem
          name="New Folder"
          keybind="ALT+N"
          IconEl={<NewFolder />}
          onClick={ctxNewItem}
        />
      </>
    )}
    <StyledItem
      name="Rename"
      keybind="F2"
      IconEl={<Rename />}
      onClick={renameItem}
    />
    <StyledItem
      name="Delete"
      keybind="Del"
      IconEl={<Trash />}
      onClick={deleteItem}
    />
    {itemData.isProgramFolder && (
      <StyledItem name="Build" IconEl={<Wrench />} onClick={runBuild} />
    )}
    {itemData.isClient && (
      <StyledItem
        name="Run"
        IconEl={<Triangle rotate="90deg" />}
        onClick={runClient}
      />
    )}
    {itemData.isClientFolder && (
      <StyledItem
        name="Run All"
        IconEl={<RunAll />}
        onClick={runClientFolder}
      />
    )}
    {itemData.isTest && (
      <StyledItem name="Test" IconEl={<TestTube />} onClick={runTest} />
    )}
    {itemData.isTestFolder && (
      <StyledItem
        name="Test All"
        IconEl={<TestPaper />}
        onClick={runTestFolder}
      />
    )}
  </ContextMenu>
);

interface ItemProps {
  name: string;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  IconEl?: ReactNode;
  keybind?: string;
  className?: string;
}

enum ItemClassName {
  NAME = "item-name",
  KEYBIND = "item-keybind",
  DELETE = "item-delete",
}

const Item: FC<ItemProps> = ({ name, onClick, IconEl, keybind, className }) => {
  return (
    <div
      className={`${className} ${
        name === "Delete" ? ItemClassName.DELETE : ""
      }`}
      onClick={onClick}
    >
      <div>
        {IconEl && IconEl}
        <span className={ItemClassName.NAME}>{name}</span>
      </div>
      {keybind && <span className={ItemClassName.KEYBIND}>{keybind}</span>}
    </div>
  );
};

const StyledItem = styled(Item)`
  ${({ theme }) => css`
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: ${theme.font?.size.small};
    color: ${theme.colors.default.textSecondary};
    border-left: 2px solid transparent;
    transition: all ${theme.transition?.duration.short}
      ${theme.transition?.type};

    & > div {
      display: flex;
      align-items: center;
      min-width: max-content;
    }

    & svg {
      margin-right: 0.5rem;
    }

    & span.${ItemClassName.KEYBIND} {
      font-weight: normal;
      margin-left: 1.5rem;
    }

    &:hover {
      cursor: pointer;
      background-color: ${theme.colors.state.hover.bg};
      border-left-color: ${theme.colors.default.primary};

      & svg {
        color: ${theme.colors.default.primary};
      }

      & span.${ItemClassName.NAME} {
        color: ${theme.colors.default.primary};
        transition: all ${theme.transition?.duration.short}
          ${theme.transition?.type};
      }

      &.${ItemClassName.DELETE} {
        border-left-color: ${theme.colors.state.error.color};

        & svg {
          color: ${theme.colors.state.error.color};
        }

        & span.${ItemClassName.NAME} {
          color: ${theme.colors.state.error.color};
        }
      }
    }
  `}
`;

export default ExplorerContextMenu;
