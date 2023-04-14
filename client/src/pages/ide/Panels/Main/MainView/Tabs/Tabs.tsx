import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
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

const Tabs = () => {
  const [explorer] = useAtom(explorerAtom);
  useAtom(refreshExplorerAtom);

  // No need memoization
  const tabs = explorer?.getTabs();

  // Close current tab with keybind
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (explorer && e.altKey && e.key.toUpperCase() === "W") {
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

const Wallet = () => {
  const [, setShowWallet] = useAtom(showWalletAtom);

  const { walletPkStr } = useCurrentWallet();

  const toggleWallet = useCallback(() => {
    setShowWallet((s) => !s);
  }, [setShowWallet]);

  if (!walletPkStr) return null;

  return (
    <WalletWrapper>
      <Button onClick={toggleWallet} kind="icon" fontWeight="bold">
        <img src="/icons/sidebar/wallet.png" alt="Wallet" />
        Wallet
      </Button>
    </WalletWrapper>
  );
};

// Same height with Side-Right Title
export const TAB_HEIGHT = "2rem";

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: space-between;
    min-height: ${TAB_HEIGHT};
    user-select: none;
    background: ${theme.components.sidebar.right.default.bg};
    border-bottom: 1px solid ${theme.colors.default.border};
    font-size: ${theme.font.code.size.small};
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
        filter: invert(${({ theme }) => (theme.isDark ? 1 : 0)});
      }
    }
  `}
`;

export default Tabs;
