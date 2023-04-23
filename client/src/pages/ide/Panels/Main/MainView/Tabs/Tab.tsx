import { FC, MouseEvent, useRef } from "react";
import { Atom, useAtom } from "jotai";
import styled, { css } from "styled-components";

import Button from "../../../../../../components/Button";
import LangIcon from "../../../../../../components/LangIcon";
import { Close } from "../../../../../../components/Icons";
import { PgExplorer } from "../../../../../../utils/pg";
import { explorerAtom } from "../../../../../../state";
import { PgThemeManager } from "../../../../../../utils/pg/theme";

interface TabProps {
  path: string;
  current?: boolean;
}

const Tab: FC<TabProps> = ({ current, path }) => {
  const [explorer] = useAtom(explorerAtom as Atom<PgExplorer>);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeTab = () => {
    explorer.closeTab(path);
  };

  const changeTab = (e: MouseEvent<HTMLDivElement>) => {
    if (closeButtonRef.current?.contains(e.target as Node)) return;

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
    & button {
      margin: 0 0.25rem 0 0.5rem;

      & svg {
        width: 0.875rem;
        height: 0.875rem;
      }
    }

    ${PgThemeManager.convertToCSS(theme.components.tabs.tab.default)};
    ${current &&
    PgThemeManager.convertToCSS(theme.components.tabs.tab.selected)};
  `}
`;

const Name = styled.span`
  margin-left: 0.375rem;
  white-space: nowrap;
`;

export default Tab;
