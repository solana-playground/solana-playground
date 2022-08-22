import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Tab from "./Tab";
import Button from "../../../Button";
import { Id } from "../../../../constants";
import {
  explorerAtom,
  refreshExplorerAtom,
  showWalletAtom,
} from "../../../../state";
import { useCurrentWallet } from "../../Wallet";

const Tabs = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);

  // No need memoization
  const tabs = explorer?.getTabs();

  // Close current tab with keybind
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (explorer && e.altKey && e.key.toUpperCase() === "W") {
        const currentPath = explorer.getCurrentFile()?.path;
        if (!currentPath) return;

        explorer.closeTab(currentPath);
        refresh();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [explorer, refresh]);

  return (
    <Wrapper id={Id.TABS}>
      <TabsWrapper>
        {tabs?.map((t, i) => (
          <Tab key={i} current={t.current} path={t.path} />
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
      <Button onClick={toggleWallet} kind="icon">
        <img src="icons/sidebar/wallet.png" alt="Wallet" />
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
    background-color: ${theme.colors.right?.bg};
    border-bottom: 1px solid ${theme.colors.default.borderColor};
    font-size: ${theme.font?.size.small};
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
      height: 0.25rem;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.scrollbar?.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.scrollbar?.thumb.color};
    }
  `}
`;

const WalletWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;

    & > button {
      background-color: ${theme.colors.default.bgPrimary};
      border-top-left-radius: ${theme.borderRadius};
      border-bottom-left-radius: ${theme.borderRadius};
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      font-weight: bold;

      & img {
        filter: invert(0.5);
        margin-right: 0.375rem;
      }

      &:hover img {
        filter: invert(1);
      }
    }
  `}
`;

export default Tabs;
