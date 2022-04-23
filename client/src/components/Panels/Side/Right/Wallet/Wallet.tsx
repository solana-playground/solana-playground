import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";

import { terminalAtom } from "../../../../../state";
import { PgTx } from "../../../../../utils/pg/tx";
import Button from "../../../../Button";
import useConnect from "./useConnect";
import useCurrentWallet from "./useCurrentWallet";
import useAirdropAmount from "./useAirdropAmount";

const Wallet = () => {
  const [, setTerminal] = useAtom(terminalAtom);
  const {
    pgButtonStatus,
    handleConnectPg,
    solButtonStatus,
    connecting,
    disconnecting,
    handleConnect,
  } = useConnect();
  const { connection: conn } = useConnection();
  const { pgWalletPk, solWalletPk } = useCurrentWallet();

  // State
  const [loading, setLoading] = useState(false);

  // Get cap amount for airdrop based on network
  const amount = useAirdropAmount();

  const airdrop = useCallback(
    async (walletPk: PublicKey) => {
      if (!amount) return;

      setLoading(true);

      let msg = "";

      try {
        const txHash = await conn.requestAirdrop(
          walletPk,
          amount * LAMPORTS_PER_SOL
        );
        msg = `Sent airdrop request. Tx hash: ${txHash}`;
        setTerminal(msg);
        await PgTx.confirm(
          txHash,
          conn,
          () => (msg = "Error receiving airdrop"),
          () => (msg = `Success. Received ${amount} SOL`)
        );
      } catch (e: any) {
        msg = e.message;
      } finally {
        setTerminal(msg);
        setLoading(false);
      }
    },
    [conn, amount, setLoading, setTerminal]
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
    <Wrapper>
      <Button onClick={handleConnectPg} kind="primary">
        {pgButtonStatus}
      </Button>
      {pgCond && (
        <Button
          onClick={airdropPg}
          disabled={loading}
          kind="primary-outline"
          style={{ marginTop: "1rem" }}
        >
          Airdrop
        </Button>
      )}
      <Or>or</Or>
      <Button
        kind="secondary-outline"
        disabled={connecting || disconnecting}
        onClick={handleConnect}
      >
        {solButtonStatus}
      </Button>
      {solCond && (
        <Button
          onClick={airdropSol}
          disabled={loading}
          kind="secondary-outline"
          style={{ marginTop: "1rem" }}
        >
          Airdrop
        </Button>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: ${theme.colors.tooltip?.bg};
    border: 1px solid ${theme.colors.default.borderColor};
  `}
`;

const Or = styled.span`
  margin: 1rem;
`;

export default Wallet;
