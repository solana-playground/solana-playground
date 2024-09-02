import { FC, useCallback, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { Rnd } from "react-rnd";

import Balance from "./Balance";
import Send from "./Send";
import Settings from "./Settings";
import Transactions from "./Transactions";
import Button from "../Button";
import FadeIn from "../FadeIn";
import Img from "../Img";
import Input from "../Input";
import Menu, { MenuItemProps } from "../Menu";
import Tooltip from "../Tooltip";
import { Close, ShortArrow } from "../Icons";
import { ClassName, Id } from "../../constants";
import { Fn, PgCommon, PgTheme, PgWallet } from "../../utils/pg";
import {
  useAutoAirdrop,
  useDarken,
  useStandardAccountChange,
  useSyncBalance,
} from "./hooks";
import {
  useKeybind,
  useOnClickOutside,
  useRenderOnChange,
  useWallet,
} from "../../hooks";

const Wallet = () => {
  useRenderOnChange(PgWallet.onDidChangeShow);

  const { wallet } = useWallet();

  useStandardAccountChange();
  useSyncBalance();
  useAutoAirdrop();

  if (!PgWallet.show || !wallet) return null;

  const tabHeight = document
    .getElementById(Id.TABS)
    ?.getBoundingClientRect().height;

  return (
    <>
      <WalletBound id={Id.WALLET_BOUND} />
      <Rnd
        default={{
          x: window.innerWidth - (WALLET_WIDTH + 12),
          y: tabHeight ?? 32,
          width: "fit-content",
          height: "fit-content",
        }}
        minWidth={WALLET_WIDTH}
        maxWidth={WALLET_WIDTH}
        enableResizing={false}
        bounds={"#" + Id.WALLET_BOUND}
        enableUserSelectHack={false}
      >
        <WalletWrapper>
          <WalletTop />
          <WalletMain />
        </WalletWrapper>
      </Rnd>
    </>
  );
};

const WALLET_WIDTH = 320;

const WalletBound = styled.div`
  ${({ theme }) => css`
    position: absolute;
    margin: ${theme.components.tabs.tab.default.height} 0.75rem
      ${theme.components.bottom.default.height}
      ${theme.components.sidebar.left.default.width};
    width: calc(
      100% - (0.75rem + ${theme.components.sidebar.left.default.width})
    );
    height: calc(
      100% -
        (
          ${theme.components.tabs.tab.default.height} +
            ${theme.components.bottom.default.height}
        )
    );
    z-index: -1;
  `}
`;

const WalletWrapper = styled(FadeIn)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.default)};
  `}
`;

const WalletTop = () => {
  const [rename, setRename] = useState(false);

  const showRename = useCallback(() => {
    setRename(true);
  }, []);

  const hideRename = useCallback(() => {
    setRename(false);
  }, []);

  return (
    <WalletTopWrapper>
      <Settings showRename={showRename} />
      {rename ? <WalletRename hideRename={hideRename} /> : <WalletName />}
      <WalletClose />
    </WalletTopWrapper>
  );
};

const WalletTopWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.top.default)};
  `}
`;

const WalletName = () => {
  const { wallet, walletPkStr } = useWallet();

  const { darken, lighten } = useDarken();

  const getAccountDisplayName = useCallback(
    (accountName: string, pkStr: string) => {
      return (
        PgCommon.withMaxLength(accountName, 12) +
        ` - (${PgCommon.shorten(pkStr)})`
      );
    },
    []
  );

  // Show al lof the Playground Wallet accounts
  const pgAccounts: MenuItemProps[] = PgWallet.accounts.map((acc, i) => ({
    name: getAccountDisplayName(
      acc.name,
      PgWallet.createWallet(acc).publicKey.toBase58()
    ),
    onClick: () => PgWallet.switch(i),
    hoverColor: "textPrimary",
  }));

  // Show all of the connected Wallet Standard accounts
  const standardAccounts: MenuItemProps[] =
    PgWallet.getConnectedStandardWallets().map((wallet) => ({
      name: getAccountDisplayName(wallet.name, wallet.publicKey!.toBase58()),
      onClick: () => {
        PgWallet.update({ state: "sol", standardName: wallet.name });
      },
      icon: <Img src={wallet.icon} alt={wallet.name} />,
      hoverColor: "secondary",
    }));

  if (!wallet) return null;

  return (
    <Menu.Dropdown
      items={pgAccounts.concat(standardAccounts)}
      onShow={darken}
      onHide={lighten}
    >
      <Tooltip element="Accounts">
        <WalletTitleWrapper>
          {!wallet.isPg && (
            <WalletTitleIcon src={wallet.icon} alt={wallet.name} />
          )}
          <WalletTitleText>
            {getAccountDisplayName(wallet.name, walletPkStr!)}
          </WalletTitleText>
          <ShortArrow rotate="90deg" />
        </WalletTitleWrapper>
      </Tooltip>
    </Menu.Dropdown>
  );
};

const WalletTitleWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.top.title.default)};
  `}
`;

const WalletTitleIcon = styled(Img)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.top.title.icon)};
  `}
`;

const WalletTitleText = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.top.title.text)};
  `}
`;

interface WalletRenameProps {
  hideRename: Fn;
}

const WalletRename: FC<WalletRenameProps> = ({ hideRename }) => {
  const [name, setName] = useState(PgWallet.current!.name);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.select();
  }, []);

  // Close on outside clicks
  useOnClickOutside(inputRef, hideRename);

  // Keybinds
  useKeybind([
    {
      keybind: "Enter",
      handle: () => {
        PgWallet.rename(name);
        hideRename();
      },
    },
    {
      keybind: "Escape",
      handle: hideRename,
    },
  ]);

  return (
    <div>
      <Input
        ref={inputRef}
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        validator={PgWallet.validateAccountName}
        placeholder="Rename wallet..."
      />
    </div>
  );
};

const WalletClose = () => (
  <CloseButton onClick={() => (PgWallet.show = false)} kind="icon">
    <Close />
  </CloseButton>
);

const CloseButton = styled(Button)`
  position: absolute;
  right: 1rem;
`;

const WalletMain = () => (
  <MainWrapper id={Id.WALLET_MAIN}>
    <Balance />
    <Send />
    <Transactions />
  </MainWrapper>
);

const MainWrapper = styled.div`
  ${({ theme }) => css`
    &::after {
      content: "";
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;
      background: #00000000;
      pointer-events: none;
      transition: all ${theme.default.transition.duration.short}
        ${theme.default.transition.type};
    }

    &.${ClassName.DARKEN}::after {
      ${PgTheme.convertToCSS(theme.components.wallet.main.backdrop)};
    }

    ${PgTheme.convertToCSS(theme.components.wallet.main.default)};
  `}
`;

export default Wallet;
