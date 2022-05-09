import { useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import { ConnState } from "../Side/Right/Wallet/connection-states";
import Link from "../../Link";
import useCurrentWallet from "../Side/Right/Wallet/useCurrentWallet";
import useConnect from "../Side/Right/Wallet/useConnect";
import { EXPLORER_URL, NETWORKS } from "../../../constants";
import useAirdropAmount from "../Side/Right/Wallet/useAirdropAmount";
import { PgCommon } from "../../../utils/pg/common";

const Bottom = () => {
  const { connection: conn } = useConnection();
  const { connStatus, handleConnectPg } = useConnect();
  const { walletPkStr, currentWallet, pgWalletPk } = useCurrentWallet();

  const [balance, setBalance] = useState<number | null>();

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
  }, [balance, currentWallet, conn]);

  // Auto airdrop if balance is less than 4 SOL
  const amount = useAirdropAmount();
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    if (
      rateLimited ||
      !amount ||
      balance === undefined ||
      balance === null ||
      !currentWallet ||
      !pgWalletPk
    )
      return;

    // Only auto-airdrop to PgWallet
    if (!pgWalletPk.equals(currentWallet.publicKey) || balance >= 4) return;

    const airdrop = async () => {
      try {
        await conn.requestAirdrop(
          currentWallet.publicKey,
          PgCommon.SolToLamports(amount)
        );
      } catch (e: any) {
        if (e.message.startsWith("429 Too Many Requests")) setRateLimited(true);
      }
    };

    airdrop();

    // Intentionally don't include 'conn' and 'amount' in the dependencies
    // because it's causing extra airdrops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, currentWallet, pgWalletPk, rateLimited, setRateLimited]);

  const networkName = useMemo(() => {
    return NETWORKS.filter((n) => n.endpoint === conn.rpcEndpoint)[0].name;
  }, [conn]);

  return (
    <Wrapper>
      <Button onClick={handleConnectPg} title="Toggle Playground Wallet">
        <ConnStatus connStatus={connStatus}></ConnStatus>
        {connStatus}
      </Button>
      {walletPkStr && (
        <>
          <Dash>-</Dash>
          <RpcEndpoint title={conn.rpcEndpoint}>{networkName}</RpcEndpoint>
          <Seperator>|</Seperator>
          <Link
            href={`${EXPLORER_URL}/address/${walletPkStr}?cluster=custom&customUrl=${conn.rpcEndpoint}`}
          >
            {walletPkStr}
          </Link>
          {balance !== undefined && balance !== null && (
            <>
              <Seperator>|</Seperator>
              <Balance>{`${balance} SOL`}</Balance>
            </>
          )}
        </>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    overflow: hidden;
    height: 1.5rem;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    font-size: ${theme.font?.size.small};
    background-color: ${theme.colors.bottom?.bg ??
    theme.colors.default.primary};
    color: ${theme.colors.bottom?.color ?? "inherit"};

    & button:hover {
      background-color: ${theme.colors.default.primary +
      theme.transparency?.low};
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
