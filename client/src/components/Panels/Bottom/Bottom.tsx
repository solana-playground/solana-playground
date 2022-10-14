import { useMemo } from "react";
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
import {
  useConnect,
  useCurrentWallet,
  useConnectOrSetupPg,
  ConnState,
} from "../Wallet";
import { useAutoAirdrop } from "./useAutoAirdrop";

const Bottom = () => {
  const { connection: conn } = useConnection();
  const { connStatus } = useConnect();
  const { handleConnectPg } = useConnectOrSetupPg();
  const { walletPkStr } = useCurrentWallet();
  const { balance } = useAutoAirdrop();

  const [networkName, cluster] = useMemo(() => {
    return [
      NETWORKS.filter((n) => n.endpoint === conn.rpcEndpoint)[0]?.name ??
        CUSTOM_NETWORK_NAME,
      PgCommon.getExplorerClusterParam(conn.rpcEndpoint),
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
