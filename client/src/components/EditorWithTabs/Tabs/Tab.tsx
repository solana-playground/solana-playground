import { FC, MouseEvent, useRef } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import LangIcon from "../../LangIcon";
import { Close } from "../../Icons";
import { PgExplorer, PgTheme } from "../../../utils/pg";

interface TabProps {
  path: string;
  current?: boolean;
}

const Tab: FC<TabProps> = ({ current, path }) => {
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
    & button {
      margin: 0 0.25rem 0 0.5rem;

      & svg {
        width: 0.875rem;
        height: 0.875rem;
      }
    }

    ${PgTheme.convertToCSS(theme.components.tabs.tab.default)};
    ${current && PgTheme.convertToCSS(theme.components.tabs.tab.selected)};
  `}
`;

const Name = styled.span`
  margin-left: 0.375rem;
  white-space: nowrap;
`;

export default Tab;
