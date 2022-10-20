import { FC, MouseEvent, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Button from "../../../../Button";
import LangIcon from "../../../../LangIcon";
import { Close } from "../../../../Icons";
import { PgExplorer } from "../../../../../utils/pg";
import { explorerAtom } from "../../../../../state";

interface TabProps {
  path: string;
  current?: boolean;
}

const Tab: FC<TabProps> = ({ current, path }) => {
  const [explorer] = useAtom(explorerAtom);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeTab = useCallback(() => {
    if (!explorer) return;

    explorer.closeTab(path);
  }, [explorer, path]);

  const changeTab = (e: MouseEvent<HTMLDivElement>) => {
    if (closeButtonRef.current?.contains(e.target as Node) || !explorer) return;

    explorer.changeCurrentFile(path);
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  const fileName = PgExplorer.getItemNameFromPath(path);

  if (!fileName) return null;

  return (
    <Wrapper
      current={current}
      onClick={changeTab}
      onContextMenu={handleContextMenu}
    >
      <LangIcon fileName={fileName} />
      <Name>{fileName}</Name>
      <Button
        ref={closeButtonRef}
        kind="icon"
        onClick={closeTab}
        title="Close (Alt+W)"
      >
        <Close />
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ current?: boolean }>`
  ${({ theme, current }) => css`
    width: fit-content;
    height: 100%;
    padding-left: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${current
      ? theme.colors.default.bgPrimary
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
  white-space: nowrap;
`;

export default Tab;
