import { useAtom } from "jotai";
import styled, { css } from "styled-components";
import { Rnd } from "react-rnd";

import Balance from "./Balance";
import Send from "./Send";
import Transactions from "./Transactions";
import Button from "../Button";
import Tooltip from "../Tooltip";
import useCopy from "../CopyButton/useCopy";
import { Close } from "../Icons";
import { WalletSettings } from "./Settings";
import { showWalletAtom } from "../../state";
import { ClassName, Id } from "../../constants";
import { PgCommon } from "../../utils/pg";
import { PgThemeManager } from "../../utils/pg/theme";
import { useCurrentWallet } from "../../hooks";

const Wallet = () => {
  const [showWallet] = useAtom(showWalletAtom);

  const { currentWallet } = useCurrentWallet();

  if (!showWallet || !currentWallet) return null;

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
          <WalletTitle />
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

const WalletWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.default)};
  `}
`;

const WalletTitle = () => {
  const { walletPkStr } = useCurrentWallet();

  const [copied, setCopied] = useCopy(walletPkStr);

  return (
    <TitleWrapper>
      <WalletSettings />
      <Tooltip text={copied ? "Copied" : "Copy"}>
        <Title onClick={setCopied}>{PgCommon.shortenPk(walletPkStr)}</Title>
      </Tooltip>
      <WalletClose />
    </TitleWrapper>
  );
};

const WalletClose = () => {
  const [, setShowWallet] = useAtom(showWalletAtom);

  const close = () => {
    setShowWallet(false);
  };

  return (
    <CloseButton onClick={close} kind="icon">
      <Close />
    </CloseButton>
  );
};

const TitleWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.title.default)};
  `}
`;

const Title = styled.span`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.title.text)};
  `}
`;

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
      ${PgThemeManager.convertToCSS(theme.components.wallet.main.backdrop)};
    }

    ${PgThemeManager.convertToCSS(theme.components.wallet.main.default)};
  `}
`;

export default Wallet;
