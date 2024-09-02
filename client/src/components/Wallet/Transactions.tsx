import { FC, useCallback, useEffect, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../Button";
import Link from "../Link";
import { Clock, Refresh, Sad, Error as ErrorIcon } from "../Icons";
import { SpinnerWithBg } from "../Loading";
import { PgCommon, PgTheme, PgWallet, PgWeb3 } from "../../utils/pg";
import { useBlockExplorer, useConnection } from "../../hooks";

const Transactions = () => {
  const [signatures, setSignatures] =
    useState<PgWeb3.ConfirmedSignatureInfo[]>();
  const [refreshCount, setRefreshCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { connection } = useConnection();

  useEffect(() => {
    const { dispose } = PgWallet.onDidChangeCurrent(async (wallet) => {
      setLoading(true);
      try {
        const _signatures = await PgCommon.transition(
          connection.getSignaturesForAddress(wallet!.publicKey, { limit: 10 })
        );

        setSignatures(_signatures);
        setError(false);
      } catch {
        setError(true);
        setSignatures([]);
      } finally {
        setLoading(false);
      }
    });

    return () => dispose();
  }, [connection, refreshCount]);

  const refresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

  // Refresh transactions every 30s
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refresh]);

  return (
    <TxsWrapper>
      <TxsTitleWrapper>
        <TxsTitleText>Transactions</TxsTitleText>
        <TxsRefreshButton kind="icon" title="Refresh" onClick={refresh}>
          <Refresh />
        </TxsRefreshButton>
      </TxsTitleWrapper>

      <TxsTable>
        <TxsTableHeader>
          <Signature>Signature</Signature>
          <Slot>Slot</Slot>
          <Time>
            Time
            <Clock />
          </Time>
        </TxsTableHeader>

        <SpinnerWithBg loading={loading}>
          {signatures?.length ? (
            signatures.map((info, i) => <Tx key={i} {...info} />)
          ) : (
            <NoTransaction>
              {!loading &&
                (error ? (
                  <>
                    <Sad />
                    Connection error.
                  </>
                ) : (
                  <>
                    <Sad />
                    No transaction found.
                  </>
                ))}
            </NoTransaction>
          )}
        </SpinnerWithBg>
      </TxsTable>
    </TxsWrapper>
  );
};

const TxsWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.main.transactions.default)};
  `}
`;

const TxsTitleWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.title.default
    )};
  `}
`;

const TxsTitleText = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.title.text
    )};
  `}
`;

const TxsRefreshButton = styled(Button)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.title.refreshButton
    )};
  `}
`;

const TxsTable = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.table.default
    )};
  `}
`;

const TxsTableHeader = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.table.header
    )};
  `}
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

const Tx: FC<PgWeb3.ConfirmedSignatureInfo> = ({
  signature,
  slot,
  err,
  blockTime,
}) => {
  const [hover, setHover] = useState(false);

  const enter = useCallback(() => setHover(true), []);
  const leave = useCallback(() => setHover(false), []);

  const now = new Date().getTime() / 1000;
  const timePassed = blockTime ? PgCommon.secondsToTime(now - blockTime) : null;

  const blockExplorer = useBlockExplorer();

  return (
    <TxWrapper onMouseEnter={enter} onMouseLeave={leave}>
      {hover ? (
        <HoverWrapper>
          <Link href={blockExplorer.getTxUrl(signature)}>
            {blockExplorer.name}
          </Link>
        </HoverWrapper>
      ) : (
        <>
          <Signature>
            {err && <ErrorIcon color="error" />}
            {signature.substring(0, 5)}...
          </Signature>
          <Slot>{slot}</Slot>
          {timePassed && <Time>{timePassed}</Time>}
        </>
      )}
    </TxWrapper>
  );
};

const TxWrapper = styled.div`
  ${({ theme }) => css`
    &:not(:last-child) {
      border-bottom: 1px solid ${theme.colors.default.border};
    }

    & > div {
      height: 1rem;
    }

    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.table.row.default
    )};
  `}
`;

const HoverWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`;

const Signature = styled.div`
  ${({ theme }) => css`
    & > svg {
      margin-right: 0.25rem;
    }

    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.table.row.signature
    )};
  `}
`;

const Slot = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.table.row.slot
    )};
  `}
`;

const Time = styled.div`
  ${({ theme }) => css`
    & > svg {
      margin-left: 0.25rem;
    }

    ${PgTheme.convertToCSS(
      theme.components.wallet.main.transactions.table.row.time
    )};
  `}
`;

export default Transactions;
