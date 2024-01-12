import { useMemo } from "react";
import styled, { css } from "styled-components";

import Link from "../../../components/Link";
import Tooltip from "../../../components/Tooltip";
import { EXPLORER_URL } from "../../../constants";
import { useConnection, useWallet } from "../../../hooks";
import { PgCommon, PgTheme } from "../../../utils/pg";

export const Address = () => {
  const { connection } = useConnection();
  const { walletPkStr } = useWallet();

  const cluster = useMemo(() => {
    return PgCommon.getExplorerClusterParam(connection.rpcEndpoint);
  }, [connection.rpcEndpoint]);

  if (!walletPkStr) return null;

  return (
    <>
      <Seperator>|</Seperator>

      <Tooltip element="Your address">
        <AddressLink href={`${EXPLORER_URL}/address/${walletPkStr}${cluster}`}>
          {walletPkStr}
        </AddressLink>
      </Tooltip>
    </>
  );
};

const Seperator = styled.span`
  margin: 0 0.75rem;
`;

const AddressLink = styled(Link)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.bottom.address)};
  `}
`;
