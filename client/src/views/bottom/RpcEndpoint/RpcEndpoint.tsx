import { useMemo } from "react";
import styled, { css } from "styled-components";

import Tooltip from "../../../components/Tooltip";
import { NETWORKS } from "../../../constants";
import { useConnection, useWallet } from "../../../hooks";
import { PgTheme } from "../../../utils/pg";

export const RpcEndpoint = () => {
  const { connection } = useConnection();
  const { wallet } = useWallet();

  const networkName = useMemo(() => {
    return (
      NETWORKS.find((n) => n.endpoint === connection.rpcEndpoint)?.name ??
      NetworkName.CUSTOM
    );
  }, [connection.rpcEndpoint]);

  if (!wallet) return null;

  return (
    <>
      <Dash>-</Dash>
      <Tooltip element={`RPC endpoint (${connection.rpcEndpoint})`}>
        <NetworkName>{networkName}</NetworkName>
      </Tooltip>
    </>
  );
};

const Dash = styled.span`
  margin-right: 0.75rem;
`;

const NetworkName = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.bottom.endpoint)};
  `}
`;
