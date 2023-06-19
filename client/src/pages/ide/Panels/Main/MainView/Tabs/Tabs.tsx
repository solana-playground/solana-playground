import { useEffect } from "react";
import styled, { css } from "styled-components";

import Tab from "./Tab";
import Button from "../../../../../../components/Button";
import { Id } from "../../../../../../constants";
import { PgTheme, PgWallet } from "../../../../../../utils/pg";
import { useExplorer, useWallet } from "../../../../../../hooks";

const Tabs = () => {
  const { explorer } = useExplorer();

  const tabs = explorer.getTabs();

  // Close current tab with keybind
  useEffect(() => {
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.altKey && ev.key.toUpperCase() === "W") {
        const currentPath = explorer.getCurrentFile()?.path;
        if (!currentPath) return;

        explorer.closeTab(currentPath);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [explorer]);

  if (!tabs.length) return null;

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

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.tabs.default)};
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
  const { wallet } = useWallet();

  if (!wallet) return null;

  return (
    <WalletWrapper>
      <Button
        onClick={() => (PgWallet.show = !PgWallet.show)}
        kind="icon"
        fontWeight="bold"
      >
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
