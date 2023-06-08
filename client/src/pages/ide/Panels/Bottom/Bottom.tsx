import { useCallback, useMemo } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../components/Button";
import Link from "../../../../components/Link";
import Tooltip from "../../../../components/Tooltip";
import {
  EXPLORER_URL,
  Id,
  NETWORKS,
  NetworkName,
  ClassName,
  WalletState,
} from "../../../../constants";
import { PgCommand, PgCommon } from "../../../../utils/pg";
import { PgThemeManager } from "../../../../utils/pg/theme";
import { useAutoAirdrop } from "./useAutoAirdrop";
import {
  useBalance,
  useConnect,
  useConnection,
  useWallet,
} from "../../../../hooks";

const Bottom = () => {
  const { connection } = useConnection();
  const { connState } = useConnect();
  const { walletPkStr } = useWallet();
  const { balance } = useBalance();

  useAutoAirdrop();

  const [networkName, cluster] = useMemo(() => {
    return [
      NETWORKS.filter((n) => n.endpoint === connection.rpcEndpoint)[0]?.name ??
        NetworkName.CUSTOM,
      PgCommon.getExplorerClusterParam(connection.rpcEndpoint),
    ];
  }, [connection.rpcEndpoint]);

  // Using a callback because this function might be resolved later than the
  // mount of this component
  const connect = useCallback(async () => {
    await PgCommand.connect.run();
  }, []);

  return (
    <Wrapper id={Id.BOTTOM}>
      <Tooltip text="Toggle Playground Wallet">
        <ConnectButton
          onClick={connect}
          kind="transparent"
          leftIcon={<ConnStatus state={connState} />}
        >
          {connState}
        </ConnectButton>
      </Tooltip>

      {walletPkStr && (
        <>
          <Dash>-</Dash>
          <Tooltip text="RPC endpoint">
            <RpcEndpoint title={connection.rpcEndpoint}>
              {networkName}
            </RpcEndpoint>
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
    display: flex;
    align-items: center;

    ${PgThemeManager.convertToCSS(theme.components.bottom.default)};

    & .${ClassName.TOOLTIP} {
      height: 100%;
      display: flex;
      align-items: center;

      & button {
        height: 100%;
      }
    }

    & svg {
      color: inherit;
    }
  `}
`;

const ConnectButton = styled(Button)`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.bottom.connect)};
  `}
`;

const ConnStatus = styled.span<{ state: WalletState }>`
  ${({ state, theme }) => css`
    &::before {
      content: "";
      display: block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      margin-right: 0.25rem;
      background: ${state === WalletState.NOT_CONNECTED
        ? theme.colors.state.error.color
        : state === WalletState.CONNECTING
        ? theme.colors.state.warning.color
        : theme.colors.state.success.color};
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
    ${PgThemeManager.convertToCSS(theme.components.bottom.endpoint)};
  `}
`;

const Address = styled(Link)`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.bottom.address)};
  `}
`;

const Balance = styled.span`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.bottom.balance)};
  `}
`;

export default Bottom;
