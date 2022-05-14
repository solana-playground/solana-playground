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
import { ConfirmedSignatureInfo, Keypair, PublicKey } from "@solana/web3.js";
import useCopyClipboard from "react-use-clipboard";
import styled, { css } from "styled-components";

import {
  endpointAtom,
  pgWalletAtom,
  showWalletAtom,
  terminalAtom,
  txHashAtom,
} from "../../../state";
import { PgTx } from "../../../utils/pg/tx";
import { PgTerminal } from "../../../utils/pg/terminal";
import { PgCommon } from "../../../utils/pg/common";
import useConnect from "./useConnect";
import useCurrentWallet from "./useCurrentWallet";
import useAirdropAmount from "./useAirdropAmount";
import { TAB_HEIGHT } from "../Main/Tabs";
import { EDITOR_SCROLLBAR_WIDTH } from "../Main/Editor";
import {
  Clock,
  Error as ErrorIcon,
  Refresh,
  Sad,
  ThreeDots,
} from "../../Icons";
import Button from "../../Button";
import DownloadButton from "../../DownloadButton";
import { PgWallet } from "../../../utils/pg/wallet";
import UploadButton from "../../UploadButton";
import Link from "../../Link";

const Wallet = () => {
  const [showWallet] = useAtom(showWalletAtom);

  const { walletPkStr } = useCurrentWallet();

  if (!showWallet || !walletPkStr) return null;

  return (
    <Wrapper>
      <WalletTitle />
      <Main>
        <Txs />
      </Main>
    </Wrapper>
  );
};

const WalletTitle = () => {
  const { walletPkStr } = useCurrentWallet();

  const [, setCopied] = useCopyClipboard(walletPkStr);

  return (
    <TitleWrapper>
      <Title onClick={setCopied} title="Copy address">
        {PgCommon.shortenPk(walletPkStr)}
      </Title>
      <WalletSettings />
    </TitleWrapper>
  );
};

const Txs = () => {
  const { connection: conn } = useConnection();
  const { currentWallet } = useCurrentWallet();

  // State
  const [signatures, setSignatures] = useState<ConfirmedSignatureInfo[]>();
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!currentWallet) return;

    const getTxs = async () => {
      try {
        const _signatures = await conn.getSignaturesForAddress(
          currentWallet.publicKey,
          { limit: 10 }
        );
        setSignatures(_signatures);
      } catch (e: any) {
        console.log(e.message);
      }
    };

    getTxs();
  }, [conn, currentWallet, refreshCount, setSignatures]);

  const refresh = useCallback(() => {
    setRefreshCount((rc) => rc + 1);
  }, [setRefreshCount]);

  return (
    <TxsWrapper>
      <TxTitleWrapper>
        <TxTitle>Transactions</TxTitle>
        <Button kind="icon" title="Refresh" onClick={refresh}>
          <Refresh />
        </Button>
      </TxTitleWrapper>
      <TxsListWrapper>
        <TxsTop>
          <Signature>Signature</Signature>
          <Slot>Slot</Slot>
          <Time>
            Time
            <Clock />
          </Time>
        </TxsTop>
        {signatures?.length ? (
          signatures.map((info, i) => <Tx key={i} {...info} />)
        ) : (
          <NoTransaction>
            <Sad />
            No transaction found.
          </NoTransaction>
        )}
      </TxsListWrapper>
    </TxsWrapper>
  );
};

const WalletSettings = () => {
  const [show, setShow] = useState(false);

  const toggle = useCallback(() => {
    setShow((s) => !s);
  }, [setShow]);

  const close = useCallback(() => {
    setShow(false);
  }, [setShow]);

  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !settingsRef.current) return;

    const handleClick = (e: globalThis.MouseEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) setShow(false);
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [show]);

  return (
    <SettingsWrapper>
      <Button onClick={toggle} kind="icon">
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
  const [, setTerminal] = useAtom(terminalAtom);
  const [, setTxHash] = useAtom(txHashAtom);

  // State
  const [loading, setLoading] = useState(false);

  // Get cap amount for airdrop based on network
  const { connection: conn } = useConnection();
  const amount = useAirdropAmount();
  const { pgWalletPk, solWalletPk } = useCurrentWallet();

  const airdrop = useCallback(
    async (walletPk: PublicKey) => {
      if (!amount || loading) return;

      setLoading(true);
      close();

      let msg = "";

      try {
        msg = PgTerminal.info("Sending an airdrop request...");
        setTerminal(msg);

        const txHash = await conn.requestAirdrop(
          walletPk,
          PgCommon.SolToLamports(amount)
        );

        setTxHash(txHash);

        const txResult = await PgTx.confirm(txHash, conn);

        if (txResult?.err)
          msg = `${PgTerminal.CROSS}  ${PgTerminal.error(
            "Error"
          )} receiving airdrop.`;
        else
          msg = `${PgTerminal.CHECKMARK}  ${PgTerminal.success(
            "Success"
          )}. Received ${amount} SOL.`;
      } catch (e: any) {
        msg = `${PgTerminal.CROSS}  ${PgTerminal.error(
          "Error"
        )} receiving airdrop: ${e.message}`;
      } finally {
        setTerminal(msg + "\n");
        setLoading(false);
      }
    },
    [conn, amount, loading, setLoading, setTerminal, setTxHash, close]
  );

  const airdropPg = useCallback(async () => {
    if (pgWalletPk) await airdrop(pgWalletPk);
  }, [pgWalletPk, airdrop]);

  const airdropSol = useCallback(async () => {
    if (solWalletPk) await airdrop(solWalletPk);
  }, [solWalletPk, airdrop]);

  const pgCond = conn && pgWalletPk && amount;
  const solCond = conn && solWalletPk && amount;

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
      <SettingsItem>Import keypair</SettingsItem>
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
        Export keypair
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

const Tx: FC<ConfirmedSignatureInfo> = ({
  signature,
  slot,
  err,
  blockTime,
}) => {
  const [endpoint] = useAtom(endpointAtom);

  const [hover, setHover] = useState(false);

  const enter = useCallback(() => setHover(true), [setHover]);
  const leave = useCallback(() => setHover(false), [setHover]);

  const now = new Date().getTime() / 1000;
  const timePassed = PgCommon.secondsToTime(now - (blockTime ?? 0));

  const [explorer, solscan] = PgCommon.getExplorerUrls(signature, endpoint);

  return (
    <TxWrapper onMouseEnter={enter} onMouseLeave={leave}>
      {hover ? (
        <HoverWrapper>
          <Link href={explorer}>Solana Explorer</Link>
          {solscan && <Link href={solscan}>Solscan</Link>}
        </HoverWrapper>
      ) : (
        <>
          <Signature>
            {err && <ErrorIcon />}
            {signature.substring(0, 5)}...
          </Signature>
          <Slot>{slot}</Slot>
          {blockTime && <Time>{timePassed}</Time>}
        </>
      )}
    </TxWrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: absolute;
    right: ${EDITOR_SCROLLBAR_WIDTH};
    top: ${TAB_HEIGHT};
    width: 20rem;
    min-height: 12rem;
    overflow: hidden;
    background-color: ${theme.colors.right?.bg ?? theme.colors.default.bg};
    border-left: 1px solid ${theme.colors.default.borderColor};
    border-bottom: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
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
  right: 1rem;
`;

const SettingsList = styled.div`
  ${({ theme }) => css`
    position: absolute;
    right: 0;
    top: 1.75rem;
    background-color: ${theme.colors.right?.bg ?? theme.colors.default.bg};
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

    &:hover {
      background-color: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.textPrimary};
      cursor: pointer;
    }
  `}
`;

const Main = styled.div`
  ${({ theme }) => css`
    background: linear-gradient(
      0deg,
      ${theme.colors.right?.bg ?? theme.colors.default.bg} 75%,
      ${theme.colors.default.primary + theme.transparency?.low} 100%
    );
    padding: 1rem;
  `}
`;

const TxsWrapper = styled.div``;

const TxTitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > button {
    margin-right: 0.5rem;
  }
`;

const TxTitle = styled.span`
  font-weight: bold;
`;

const TxsListWrapper = styled.div`
  ${({ theme }) => css`
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
    background-color: ${theme.colors.right?.otherBg};
    margin-top: 0.5rem;
  `}
`;

const TxsTop = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 1rem;
    display: flex;
    font-size: ${theme.font?.size.small};
    color: ${theme.colors.default.textSecondary};
    background-color: ${theme.colors.right?.bg ?? theme.colors.default.bg};
    font-weight: bold;

    &:not(:last-child) {
      border-bottom: 1px solid ${theme.colors.default.borderColor};
    }
  `}
`;

const TxWrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 1rem;
    display: flex;
    font-size: ${theme.font?.size.small};
    color: ${theme.colors.default.textSecondary};

    &:not(:last-child) {
      border-bottom: 1px solid ${theme.colors.default.borderColor};
    }

    &:hover {
      color: ${theme.colors.default.textPrimary};
      background: linear-gradient(
        0deg,
        ${theme.colors.right?.bg ?? theme.colors.default.bg} 75%,
        ${theme.colors.default.primary + theme.transparency?.low} 100%
      );
    }
  `}
`;

const HoverWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;

  & > a:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

const Signature = styled.div`
  width: 40%;
  display: flex;
  align-items: center;

  & > svg {
    margin-right: 0.25rem;
    color: ${({ theme }) => theme.colors.state.error.color};
  }
`;

const Slot = styled.div`
  width: 40%;
`;

const Time = styled.div`
  width: 20%;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  & > svg {
    margin-left: 0.25rem;
  }
`;

const NoTransaction = styled.div`
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.default.textSecondary};

  & > svg {
    margin-right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
  }
`;

export default Wallet;
