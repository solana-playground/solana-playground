import {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAtom } from "jotai";
import { Buffer } from "buffer";
import { useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";
import { Rnd } from "react-rnd";

import Balance from "./Balance";
import Send from "./Send";
import Transactions from "./Transactions";
import Tooltip from "../../Tooltip";
import useCopy from "../../CopyButton/useCopy";
import Button from "../../Button";
import DownloadButton from "../../DownloadButton";
import UploadButton from "../../UploadButton";
import { ClassName, Id } from "../../../constants";
import {
  pgWalletAtom,
  showWalletAtom,
  terminalOutputAtom,
  txHashAtom,
} from "../../../state";
import { PgCommon, PgTerminal, PgTx, PgWallet } from "../../../utils/pg";
import { Close, ThreeDots } from "../../Icons";
import { EDITOR_SCROLLBAR_WIDTH } from "../Main/Editor";
import { ICONBAR_WIDTH } from "../Side/Left";
import { BOTTOM_HEIGHT } from "../Bottom";
import { useCurrentWallet, useConnect, useAirdropAmount } from "./";

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
      <Tooltip text={copied ? "Copied" : "Copy address"}>
        <Title onClick={setCopied}>{PgCommon.shortenPk(walletPkStr)}</Title>
      </Tooltip>
      <WalletClose />
    </TitleWrapper>
  );
};

const WalletSettings = () => {
  const [show, setShow] = useState(false);

  const toggle = useCallback(() => {
    setShow((s) => !s);
    document.getElementById(Id.WALLET_MAIN)?.classList.toggle(ClassName.DARKEN);
  }, [setShow]);

  const close = useCallback(() => {
    setShow(false);
    document.getElementById(Id.WALLET_MAIN)?.classList.remove(ClassName.DARKEN);
  }, [setShow]);

  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !settingsRef.current) return;

    const handleClick = (e: globalThis.MouseEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) close();
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [show, close]);

  return (
    <SettingsWrapper>
      <Button onClick={toggle} kind="icon" title="More">
        <ThreeDots />
      </Button>
      {show && (
        <SettingsList ref={settingsRef}>
          <Airdrop close={close} />
          <ImportKeypair close={close} />
          <ExportKeypair />
          <Connect close={close} />
        </SettingsList>
      )}
    </SettingsWrapper>
  );
};

interface SettingsItemProps {
  close: () => void;
}

const Airdrop: FC<SettingsItemProps> = ({ close }) => {
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setTxHash] = useAtom(txHashAtom);

  // Get cap amount for airdrop based on network
  const { connection: conn } = useConnection();
  const amount = useAirdropAmount();
  const { pgWalletPk, solWalletPk } = useCurrentWallet();

  const airdrop = useCallback(
    async (walletPk: PublicKey) => {
      await PgTerminal.run(async () => {
        if (!amount) return;

        close();

        let msg;
        try {
          setTerminal(PgTerminal.info("Sending an airdrop request..."));

          // Airdrop tx is sometimes successful even when balance hasn't changed
          // Instead of confirming the tx, we will check before and after balance
          const beforeBalance = await conn.getBalance(walletPk, "processed");

          const txHash = await conn.requestAirdrop(
            walletPk,
            PgCommon.solToLamports(amount)
          );
          setTxHash(txHash);

          // Allow enough time for balance to update by waiting for confirmation
          await PgTx.confirm(txHash, conn);

          const afterBalance = await conn.getBalance(walletPk, "processed");

          if (afterBalance > beforeBalance)
            msg = `${PgTerminal.CHECKMARK}  ${PgTerminal.success(
              "Success."
            )} Received ${PgTerminal.bold(amount.toString())} SOL.`;
          else
            msg = `${PgTerminal.CROSS}  ${PgTerminal.error(
              "Error receiving airdrop."
            )}`;
        } catch (e: any) {
          const convertedError = PgTerminal.convertErrorMessage(e.message);

          msg = `${PgTerminal.CROSS}  ${PgTerminal.error(
            "Error receiving airdrop:"
          )} ${convertedError}`;
        } finally {
          setTerminal(msg + "\n");
        }
      });
    },
    [conn, amount, setTerminal, setTxHash, close]
  );

  const airdropPg = useCallback(async () => {
    if (pgWalletPk) await airdrop(pgWalletPk);
  }, [pgWalletPk, airdrop]);

  const airdropSol = useCallback(async () => {
    if (solWalletPk) await airdrop(solWalletPk);
  }, [solWalletPk, airdrop]);

  const pgCond = pgWalletPk && conn && amount;
  const solCond = solWalletPk && conn && amount;

  return (
    <>
      {pgCond && <SettingsItem onClick={airdropPg}>Airdrop</SettingsItem>}
      {solCond && (
        <SettingsItem onClick={airdropSol}>Airdrop Phantom</SettingsItem>
      )}
    </>
  );
};

const ImportKeypair: FC<SettingsItemProps> = ({ close }) => {
  const [, setPgWallet] = useAtom(pgWalletAtom);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeArrayBuffer(arrayBuffer);
      const buffer = Buffer.from(JSON.parse(decodedString));
      if (buffer.length !== 64) throw new Error("Invalid keypair");

      // Check if the keypair is valid
      Keypair.fromSecretKey(new Uint8Array(buffer));

      // Update localstorage
      PgWallet.update({
        sk: Array.from(buffer),
      });

      // Update global wallet state
      setPgWallet(new PgWallet());
      close();
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <UploadButton accept=".json" onUpload={handleUpload} noButton>
      <SettingsItem>Import Keypair</SettingsItem>
    </UploadButton>
  );
};

const ExportKeypair = () => {
  const walletKp = PgWallet.getKp();

  return (
    <DownloadButton
      href={PgCommon.getUtf8EncodedString(Array.from(walletKp.secretKey))}
      download="wallet-keypair.json"
      noButton
    >
      <SettingsItem className="export-wallet-keypair">
        Export Keypair
      </SettingsItem>
    </DownloadButton>
  );
};

const Connect: FC<SettingsItemProps> = ({ close }) => {
  const { solButtonStatus, connecting, disconnecting, handleConnect } =
    useConnect();

  const handleClick = () => {
    if (connecting || disconnecting) return;

    handleConnect();
    close();
  };

  return <SettingsItem onClick={handleClick}>{solButtonStatus}</SettingsItem>;
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

const SettingsWrapper = styled.div`
  position: absolute;
  left: 1rem;
  z-index: 2;
`;

const SettingsList = styled.div`
  ${({ theme }) => css`
    position: absolute;
    left: 0;
    top: 1.75rem;
    background-color: ${theme.colors?.right?.bg};
    font-size: ${theme.font?.size.small};
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
    min-width: 8.5rem;

    & > :not(:last-child),
    & .export-wallet-keypair {
      border-bottom: 1px solid ${theme.colors.default.borderColor};
    }
  `}
`;

const SettingsItem = styled.div`
  ${({ theme }) => css`
    display: flex;
    padding: 0.5rem 0.75rem;
    transition: all ${theme.transition?.duration.short}
      ${theme.transition?.type};

    &:hover {
      background-color: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.textPrimary};
      cursor: pointer;
    }
  `}
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
      ${theme.colors.default.primary + theme.transparency?.low} 100%
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
      transition: all ${theme.transition?.duration.short}
        ${theme.transition?.type};
    }

    &.${ClassName.DARKEN}::after {
      opacity: 0.5;
      z-index: 1;
    }
  `}
`;

export default Wallet;
