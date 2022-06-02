import { FC, MouseEvent, useRef } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import LangIcon from "../../../LangIcon";
import Button from "../../../Button";
import { Close } from "../../../Icons";
import { PgExplorer } from "../../../../utils/pg";
import { explorerAtom, refreshExplorerAtom } from "../../../../state";

interface TabProps {
  path: string;
  current?: boolean;
}

const Tab: FC<TabProps> = ({ current, path }) => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const fileName = PgExplorer.getItemNameFromPath(path);

  if (!fileName) return null;

  const changeTab = (e: MouseEvent<HTMLDivElement>) => {
    if (closeButtonRef.current?.contains(e.target as Node)) return;

    explorer?.changeCurrentFile(path);
    refresh();
  };

  const closeTab = () => {
    explorer?.removeFromTabs(path);
    refresh();
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  return (
    <Wrapper
      current={current}
      onClick={changeTab}
      onContextMenu={handleContextMenu}
    >
      <LangIcon fileName={fileName} />
      <Name>{fileName}</Name>
      <Button ref={closeButtonRef} kind="icon" onClick={closeTab} title="Close">
        <Close />
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ current?: boolean }>`
  ${({ theme, current }) => css`
    width: fit-content;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${current
      ? theme.colors.default.bg
      : theme.colors.right?.bg};
    color: ${current
      ? theme.colors.default.textPrimary
      : theme.colors.default.textSecondary};
    border: 1px solid transparent;
    border-right-color: ${theme.colors.default.borderColor};
    border-top-color: ${current
      ? theme.colors.default.secondary
      : "transparent"};

    &:hover {
      cursor: pointer;
    }

    & img {
      margin-left: 0.5rem;
    }

    & button {
      margin: 0 0.25rem 0 0.5rem;
      color: ${theme.colors.default.textSecondary};

      & svg {
        width: 0.875rem;
        height: 0.875rem;
      }
    }
  `}
`;

const Name = styled.span`
  margin-left: 0.375rem;
`;

export default Tab;
