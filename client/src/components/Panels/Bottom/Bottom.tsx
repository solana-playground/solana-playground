import { useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import styled, { css } from "styled-components";

import Button from "../../Button";
import { ConnState } from "../Side/Right/Wallet/connection-states";
import Link from "../../Link";
import useCurrentWallet from "../Side/Right/Wallet/useCurrentWallet";
import useConnect from "../Side/Right/Wallet/useConnect";
import { NETWORKS } from "../../../constants/connection";

const Bottom = () => {
  const { connection: conn } = useConnection();
  const { connStatus, handleConnectPg } = useConnect();
  const { walletPkStr, currentWallet } = useCurrentWallet();

  const [balance, setBalance] = useState<number | null>();

  useEffect(() => {
    if (!currentWallet) return;

    const fetchBalance = async () => {
      const lamports = await conn.getBalance(currentWallet.publicKey);

      setBalance(lamports / LAMPORTS_PER_SOL);
    };
    fetchBalance().catch(() => setBalance(null));

    const id = conn.onAccountChange(currentWallet.publicKey, (a) =>
      setBalance(a.lamports / LAMPORTS_PER_SOL)
    );

    return () => {
      conn.removeAccountChangeListener(id);
    };
  }, [balance, currentWallet, conn]);

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
            href={`https://explorer.solana.com/address/${walletPkStr}?cluster=custom&customUrl=${conn.rpcEndpoint}`}
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
