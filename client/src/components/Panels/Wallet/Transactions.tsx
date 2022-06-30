import { FC, useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import { ConfirmedSignatureInfo } from "@solana/web3.js";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Link from "../../Link";
import { connAtom } from "../../../state";
import { PgCommon } from "../../../utils/pg";
import { Clock, Refresh, Sad, Error as ErrorIcon } from "../../Icons";
import { SpinnerWithBg } from "../../Loading";
import { useCurrentWallet } from "./useCurrentWallet";

const Transactions = () => {
  const { connection: conn } = useConnection();
  const { currentWallet } = useCurrentWallet();

  // State
  const [signatures, setSignatures] = useState<ConfirmedSignatureInfo[]>();
  const [refreshCount, setRefreshCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!currentWallet) return;

    const getTxs = async () => {
      setLoading(true);
      try {
        await PgCommon.sleep(PgCommon.TRANSITION_SLEEP);
        const _signatures = await conn.getSignaturesForAddress(
          currentWallet.publicKey,
          { limit: 10 }
        );

        setSignatures(_signatures);
        setError(false);
      } catch {
        setError(true);
        setSignatures([]);
      } finally {
        setLoading(false);
      }
    };

    getTxs();
  }, [conn, currentWallet, refreshCount, setSignatures, setLoading, setError]);

  const refresh = useCallback(() => {
    setRefreshCount((rc) => rc + 1);
  }, [setRefreshCount]);

  // Refresh transactions every 30s
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refresh]);

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
        <SpinnerWithBg loading={loading}>
          {signatures?.length ? (
            signatures.map((info, i) => <Tx key={i} {...info} />)
          ) : (
            <NoTransaction>
              {!loading ? (
                error ? (
                  <>
                    <Sad />
                    Connection error.
                  </>
                ) : (
                  <>
                    <Sad />
                    No transaction found.
                  </>
                )
              ) : null}
            </NoTransaction>
          )}
        </SpinnerWithBg>
      </TxsListWrapper>
    </TxsWrapper>
  );
};

const Tx: FC<ConfirmedSignatureInfo> = ({
  signature,
  slot,
  err,
  blockTime,
}) => {
  const [conn] = useAtom(connAtom);

  const [hover, setHover] = useState(false);

  const enter = useCallback(() => setHover(true), [setHover]);
  const leave = useCallback(() => setHover(false), [setHover]);

  const now = new Date().getTime() / 1000;
  const timePassed = PgCommon.secondsToTime(now - (blockTime ?? 0));

  const [explorer, solscan] = PgCommon.getExplorerTxUrls(
    signature,
    conn.endpoint!
  );

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
    background-color: ${theme.colors.default.bgSecondary};
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
        ${theme.colors.default.bgSecondary} 75%,
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

export default Transactions;
