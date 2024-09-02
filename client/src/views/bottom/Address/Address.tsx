import styled, { css } from "styled-components";

import Link from "../../../components/Link";
import Tooltip from "../../../components/Tooltip";
import { useBlockExplorer, useWallet } from "../../../hooks";
import { PgTheme } from "../../../utils/pg";

export const Address = () => {
  const blockExplorer = useBlockExplorer();
  const { walletPkStr } = useWallet();

  if (!walletPkStr) return null;

  return (
    <>
      <Seperator>|</Seperator>

      <Tooltip element="Your address">
        <AddressLink href={blockExplorer.getAddressUrl(walletPkStr)}>
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
