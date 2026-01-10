import styled, { css } from "styled-components";

import Tooltip from "../../../components/Tooltip";
import { useConnection, useRenderOnChange, useWallet } from "../../../hooks";
import { PgCommon, PgConnection, PgTheme } from "../../../utils";

export const Cluster = () => {
  const cluster = useRenderOnChange(PgConnection.onDidChangeCluster);
  const connection = useConnection();
  const wallet = useWallet();

  if (!wallet) return null;

  return (
    <Tooltip element={`Cluster (URL: ${connection.rpcEndpoint})`}>
      <ClusterName>{PgCommon.toTitleFromKebab(cluster)}</ClusterName>
    </Tooltip>
  );
};

const ClusterName = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.bottom.cluster)};
  `}
`;
