import { useMemo } from "react";
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
} from "../../../../constants";
import { PgCommon } from "../../../../utils/pg";
import { PgThemeManager } from "../../../../utils/pg/theme";
import { useAutoAirdrop } from "./useAutoAirdrop";
import {
  useConnect,
  useCurrentWallet,
  useConnectOrSetupPg,
  ConnState,
} from "../Wallet";
import { usePgConnection } from "../../../../hooks";

const Bottom = () => {
  const { connection: conn } = usePgConnection();
  const { connStatus } = useConnect();
  const { handleConnectPg } = useConnectOrSetupPg();
  const { walletPkStr } = useCurrentWallet();
  const { balance } = useAutoAirdrop();

  const [networkName, cluster] = useMemo(() => {
    return [
      NETWORKS.filter((n) => n.endpoint === conn.rpcEndpoint)[0]?.name ??
        NetworkName.CUSTOM,
      PgCommon.getExplorerClusterParam(conn.rpcEndpoint),
    ];
  }, [conn.rpcEndpoint]);

  return (
    <Wrapper id={Id.BOTTOM}>
      <Tooltip text="Toggle Playground Wallet">
        <ConnectButton
          onClick={handleConnectPg}
          kind="transparent"
          leftIcon={<ConnStatus connStatus={connStatus} />}
        >
          {connStatus}
        </ConnectButton>
      </Tooltip>

      {walletPkStr && (
        <>
          <Dash>-</Dash>
          <Tooltip text="RPC endpoint">
            <RpcEndpoint title={conn.rpcEndpoint}>{networkName}</RpcEndpoint>
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

export const BOTTOM_HEIGHT = "1.5rem";

const Wrapper = styled.div`
  ${({ theme }) => css`
    height: ${BOTTOM_HEIGHT};
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

const ConnStatus = styled.span<{ connStatus: string }>`
  ${({ connStatus, theme }) => css`
    &::before {
      content: "";
      display: block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      margin-right: 0.25rem;
      background: ${connStatus === ConnState.NOT_CONNECTED
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
