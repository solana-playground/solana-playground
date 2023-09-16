import { FC, MouseEvent, useRef } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import LangIcon from "../../LangIcon";
import { Close } from "../../Icons";
import { PgExplorer, PgTheme } from "../../../utils/pg";

interface TabProps {
  path: string;
  isCurrent: boolean;
}

const Tab: FC<TabProps> = ({ path, isCurrent }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeTab = () => {
    PgExplorer.closeTab(path);
  };

  const changeTab = (ev: MouseEvent<HTMLDivElement>) => {
    if (!closeButtonRef.current?.contains(ev.target as Node)) {
      PgExplorer.changeCurrentFile(path);
    }
  };

  const handleContextMenu = (ev: MouseEvent) => {
    ev.preventDefault();
  };

  const fileName = PgExplorer.getItemNameFromPath(path);
  const relativePath = PgExplorer.getRelativePath(path);

  return (
    <Wrapper
      isCurrent={isCurrent}
      title={relativePath}
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

const Wrapper = styled.div<{ isCurrent?: boolean }>`
  ${({ theme, isCurrent }) => css`
    & button {
      ${!isCurrent && "opacity: 0;"}
      margin: 0 0.25rem 0 0.5rem;

      & svg {
        width: 0.875rem;
        height: 0.875rem;
      }
    }

    &:hover button {
      opacity: 1;
    }

    ${PgTheme.convertToCSS(theme.components.tabs.tab.default)};
    ${isCurrent && PgTheme.convertToCSS(theme.components.tabs.tab.selected)};
  `}
`;

const Name = styled.span`
  margin-left: 0.375rem;
  white-space: nowrap;
`;

export default Tab;
