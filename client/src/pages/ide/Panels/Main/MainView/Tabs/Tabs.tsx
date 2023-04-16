import { useCallback, useEffect } from "react";
import { Atom, useAtom } from "jotai";
import styled, { css } from "styled-components";

import Tab from "./Tab";
import Button from "../../../../../../components/Button";
import { Id } from "../../../../../../constants";
import {
  explorerAtom,
  refreshExplorerAtom,
  showWalletAtom,
} from "../../../../../../state";
import { useCurrentWallet } from "../../../Wallet";
import { PgExplorer } from "../../../../../../utils/pg";
import { PgThemeManager } from "../../../../../../utils/pg/theme";

const Tabs = () => {
  const [explorer] = useAtom(explorerAtom as Atom<PgExplorer>);
  useAtom(refreshExplorerAtom);

  // No need for memoization
  const tabs = explorer.getTabs();

  // Close current tab with keybind
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toUpperCase() === "W") {
        const currentPath = explorer.getCurrentFile()?.path;
        if (!currentPath) return;

        explorer.closeTab(currentPath);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [explorer]);

  if (!tabs?.length) return null;

  return (
    <Wrapper id={Id.TABS}>
      <TabsWrapper>
        {tabs.map((t, i) => (
          <Tab key={i} current={t.meta?.current} path={t.path} />
        ))}
      </TabsWrapper>
      <Wallet />
    </Wrapper>
  );
};

// Same height with Side-Right Title
export const TAB_HEIGHT = "2rem";

const Wrapper = styled.div`
  ${({ theme }) => css`
    min-height: ${TAB_HEIGHT};

    ${PgThemeManager.convertToCSS(theme.components.tabs.default)};
  `}
`;

const TabsWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar {
      height: 0.25rem !important;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent !important;
      border-radius: ${theme.default.borderRadius};
      background-color: ${theme.default.scrollbar.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.default.scrollbar.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.default.scrollbar.thumb.color};
    }
  `}
`;

const Wallet = () => {
  const [, setShowWallet] = useAtom(showWalletAtom);

  const { currentWallet } = useCurrentWallet();

  const toggleWallet = useCallback(() => {
    setShowWallet((s) => !s);
  }, [setShowWallet]);

  if (!currentWallet) return null;

  return (
    <WalletWrapper>
      <Button onClick={toggleWallet} kind="icon" fontWeight="bold">
        <img src="/icons/sidebar/wallet.png" alt="Wallet" />
        Wallet
      </Button>
    </WalletWrapper>
  );
};

const WalletWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;

    & > button {
      background: ${theme.colors.default.bgPrimary};
      border-top-left-radius: ${theme.default.borderRadius};
      border-bottom-left-radius: ${theme.default.borderRadius};
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;

      & img {
        filter: invert(0.5);
        margin-right: 0.375rem;
      }

      &:hover img {
        filter: invert(${theme.isDark ? 1 : 0});
      }
    }
  `}
`;

export default Tabs;
