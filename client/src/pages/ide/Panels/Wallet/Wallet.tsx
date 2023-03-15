import { useAtom } from "jotai";
import styled, { css } from "styled-components";
import { Rnd } from "react-rnd";

import Balance from "./Balance";
import Send from "./Send";
import Transactions from "./Transactions";
import Button from "../../../../components/Button";
import Tooltip from "../../../../components/Tooltip";
import useCopy from "../../../../components/CopyButton/useCopy";
import { Close } from "../../../../components/Icons";
import { ClassName, Id } from "../../../../constants";
import { showWalletAtom } from "../../../../state";
import { PgCommon } from "../../../../utils/pg";
import { EDITOR_SCROLLBAR_WIDTH } from "../Main/MainView/Editor";
import { ICONBAR_WIDTH } from "../Side/Left";
import { BOTTOM_HEIGHT } from "../Bottom";
import { WalletSettings } from "./Settings";
import { useCurrentWallet } from "./useCurrentWallet";

const Wallet = () => {
  const [showWallet] = useAtom(showWalletAtom);

  const { walletPkStr } = useCurrentWallet();

  if (!showWallet || !walletPkStr) return null;

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
          <Main id={Id.WALLET_MAIN}>
            <Balance />
            <Send />
            <Transactions />
          </Main>
        </WalletWrapper>
      </Rnd>
    </>
  );
};

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
    <WalletCloseWrapper>
      <Button onClick={close} kind="icon">
        <Close />
      </Button>
    </WalletCloseWrapper>
  );
};

const WALLET_WIDTH = 320;
const TAB_HEIGHT = "2rem";

const WalletBound = styled.div`
  position: absolute;
  margin: ${TAB_HEIGHT} ${EDITOR_SCROLLBAR_WIDTH} ${BOTTOM_HEIGHT}
    ${ICONBAR_WIDTH};
  width: calc(
    100% -
      ${PgCommon.calculateRem(EDITOR_SCROLLBAR_WIDTH, ICONBAR_WIDTH, "add")}
  );
  height: calc(
    100% - ${PgCommon.calculateRem(TAB_HEIGHT, BOTTOM_HEIGHT, "add")}
  );
  z-index: -1;
`;

const WalletWrapper = styled.div`
  ${({ theme }) => css`
    width: 100%;
    height: 100%;
    background-color: ${theme.colors?.right?.bg};
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
    z-index: 2;
  `}
`;

const TitleWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem;
    color: ${theme.colors.default.textSecondary};
    position: relative;
    height: 2rem;
  `}
`;

const Title = styled.span`
  &:hover {
    cursor: pointer;
    color ${({ theme }) => theme.colors.default.textPrimary};
  }
`;

const WalletCloseWrapper = styled.div`
  position: absolute;
  right: 1rem;
`;

const Main = styled.div`
  ${({ theme }) => css`
    background: linear-gradient(
      0deg,
      ${theme.colors?.right?.bg} 75%,
      ${theme.colors.default.primary + theme.transparency.low} 100%
    );
    padding: 1rem;
    cursor: auto;
    position: relative;

    &::after {
      content: "";
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;
      background: #000;
      opacity: 0;
      z-index: -1;
      transition: all ${theme.transition.duration.short}
        ${theme.transition.type};
    }

    &.${ClassName.DARKEN}::after {
      opacity: 0.5;
      z-index: 1;
    }
  `}
`;

export default Wallet;
