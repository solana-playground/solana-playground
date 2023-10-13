import { useCallback, useMemo } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../components/Button";
import Link from "../../../../components/Link";
import Tooltip from "../../../../components/Tooltip";
import { EXPLORER_URL, Id, NETWORKS, NetworkName } from "../../../../constants";
import { PgCommand, PgCommon, PgTheme } from "../../../../utils/pg";
import { useBalance, useConnection, useWallet } from "../../../../hooks";

const Bottom = () => {
  const { connection } = useConnection();
  const { wallet, walletPkStr } = useWallet();
  const { balance } = useBalance();

  const [networkName, cluster] = useMemo(() => {
    return [
      NETWORKS.filter((n) => n.endpoint === connection.rpcEndpoint)[0]?.name ??
        NetworkName.CUSTOM,
      PgCommon.getExplorerClusterParam(connection.rpcEndpoint),
    ];
  }, [connection.rpcEndpoint]);

  // Using a callback because this function might be resolved later than the
  // mount of this component
  const connect = useCallback(() => PgCommand.connect.run(), []);

  return (
    <Wrapper id={Id.BOTTOM}>
      <Tooltip text="Toggle Playground Wallet">
        <ConnectButton
          onClick={connect}
          kind="transparent"
          leftIcon={<WalletStatus isConnected={!!walletPkStr} />}
        >
          {wallet
            ? wallet.isPg
              ? "Connected to Playground Wallet"
              : `Connected to ${wallet.name}`
            : "Not connected"}
        </ConnectButton>
      </Tooltip>

      {walletPkStr && (
        <>
          <Dash>-</Dash>
          <Tooltip text={`RPC endpoint (${connection.rpcEndpoint})`}>
            <RpcEndpoint>{networkName}</RpcEndpoint>
          </Tooltip>

          <Seperator>|</Seperator>

          <Tooltip text="Your address">
            <Address href={`${EXPLORER_URL}/address/${walletPkStr}${cluster}`}>
              {walletPkStr}
            </Address>
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

const Wrapper = styled.div`
  ${({ theme }) => css`
    & svg {
      color: inherit;
    }

    & > div {
      height: 100%;
      display: flex;
      align-items: center;
    }

    ${PgTheme.convertToCSS(theme.components.bottom.default)};
  `}
`;

const ConnectButton = styled(Button)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.bottom.connect)};
  `}
`;

const WalletStatus = styled.span<{ isConnected: boolean }>`
  ${({ isConnected, theme }) => css`
    &::before {
      content: "";
      display: block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      margin-right: 0.25rem;
      background: ${isConnected
        ? theme.colors.state.success.color
        : theme.colors.state.error.color};
    }
  `}
`;

const Dash = styled.span`
  margin-right: 0.75rem;
`;

const Seperator = styled.span`
  margin: 0 0.75rem;
`;

const RpcEndpoint = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.bottom.endpoint)};
  `}
`;

const Address = styled(Link)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.bottom.address)};
  `}
`;

const Balance = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.bottom.balance)};
  `}
`;

export default Bottom;
