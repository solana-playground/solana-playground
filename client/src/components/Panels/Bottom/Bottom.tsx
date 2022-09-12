import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Link from "../../Link";
import Tooltip from "../../Tooltip";
import {
  EXPLORER_URL,
  Id,
  NETWORKS,
  CUSTOM_NETWORK_NAME,
  ClassName,
} from "../../../constants";
import { PgCommon } from "../../../utils/pg";
import { balanceAtom } from "../../../state";
import {
  useAirdropAmount,
  useConnect,
  useCurrentWallet,
  useConnectOrSetupPg,
  ConnState,
} from "../Wallet";

const Bottom = () => {
  const [balance, setBalance] = useAtom(balanceAtom);

  const { connection: conn } = useConnection();
  const { connStatus } = useConnect();
  const { handleConnectPg } = useConnectOrSetupPg();
  const { walletPkStr, currentWallet, pgWalletPk } = useCurrentWallet();

  useEffect(() => {
    if (!currentWallet) return;

    const fetchBalance = async () => {
      const lamports = await conn.getBalance(currentWallet.publicKey);

      setBalance(PgCommon.lamportsToSol(lamports));
    };
    fetchBalance().catch(() => setBalance(null));

    // Listen for balance changes
    const id = conn.onAccountChange(currentWallet.publicKey, (a) =>
      setBalance(PgCommon.lamportsToSol(a.lamports))
    );

    return () => {
      conn.removeAccountChangeListener(id);
    };
  }, [balance, currentWallet, conn, setBalance]);

  // Auto airdrop if balance is less than 4 SOL
  const airdropAmount = useAirdropAmount();
  const [rateLimited, setRateLimited] = useState(false);

  const airdropping = useRef(false);

  useEffect(() => {
    const airdrop = async (_balance: number | null = balance) => {
      if (
        airdropping.current ||
        rateLimited ||
        !airdropAmount ||
        _balance === undefined ||
        _balance === null ||
        _balance >= 4 ||
        !currentWallet ||
        !pgWalletPk ||
        // Only auto-airdrop to PgWallet
        !pgWalletPk.equals(currentWallet.publicKey)
      )
        return;

      try {
        airdropping.current = true;
        const txHash = await conn.requestAirdrop(
          pgWalletPk,
          PgCommon.solToLamports(airdropAmount)
        );
        await conn.confirmTransaction(txHash, "finalized");
      } catch (e: any) {
        console.log(e.message);
        setRateLimited(true);
      } finally {
        airdropping.current = false;
        _balance = PgCommon.lamportsToSol(await conn.getBalance(pgWalletPk));
        airdrop(_balance);
      }
    };

    airdrop();
  }, [balance, currentWallet, pgWalletPk, rateLimited, airdropAmount, conn]);

  const [networkName, cluster] = useMemo(() => {
    return [
      NETWORKS.filter((n) => n.endpoint === conn.rpcEndpoint)[0]?.name ??
        CUSTOM_NETWORK_NAME,
      PgCommon.getExplorerCluster(conn.rpcEndpoint),
    ];
  }, [conn]);

  return (
    <Wrapper id={Id.BOTTOM}>
      <Tooltip text="Toggle Playground Wallet">
        <Button onClick={handleConnectPg}>
          <ConnStatus connStatus={connStatus}></ConnStatus>
          {connStatus}
        </Button>
      </Tooltip>

      {walletPkStr && (
        <>
          <Dash>-</Dash>
          <Tooltip text="RPC Endpoint">
            <RpcEndpoint title={conn.rpcEndpoint}>{networkName}</RpcEndpoint>
          </Tooltip>
          <Seperator>|</Seperator>
          <Tooltip text="Your address">
            <Link href={`${EXPLORER_URL}/address/${walletPkStr}${cluster}`}>
              {walletPkStr}
            </Link>
          </Tooltip>
          {balance !== undefined && balance !== null && (
            <>
              <Seperator>|</Seperator>
              <Tooltip text="Current balance">
                <Balance>{`${balance} SOL`}</Balance>
              </Tooltip>
            </>
          )}
        </>
      )}
    </Wrapper>
  );
};

export const BOTTOM_HEIGHT = "1.5rem";

const Wrapper = styled.div`
  ${({ theme }) => css`
    height: ${BOTTOM_HEIGHT};
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    font-size: ${theme.font?.size.small};
    background-color: ${theme.colors.bottom?.bg ??
    theme.colors.default.primary};
    color: ${theme.colors.bottom?.color ?? "inherit"};

    & .${ClassName.TOOLTIP} {
      height: 100%;
      display: flex;
      align-items: center;

      & button {
        padding: 0 0.75rem;
        height: 100%;

        &:hover {
          background-color: ${theme.colors.default.primary +
          theme.transparency?.low};
        }
      }
    }
  `}
`;

const ConnStatus = styled.span<{ connStatus: string }>`
  ${({ connStatus, theme }) => css`
    &:after {
      content: "";
      display: block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      margin-right: 0.5rem;
      background-color: ${connStatus === ConnState.NOT_CONNECTED
        ? theme.colors.state.error.color
        : connStatus === ConnState.CONNECTING
        ? theme.colors.state.warning.color
        : theme.colors.state.success.color};
    }
  `}
`;

const Dash = styled.span`
  margin-right: 0.75rem;
`;

const RpcEndpoint = styled.span``;

const Seperator = styled.span`
  margin: 0 0.75rem;
`;

const Balance = styled.span``;

export default Bottom;
