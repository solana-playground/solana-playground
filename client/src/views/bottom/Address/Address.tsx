import styled, { css } from "styled-components";

import Link from "../../../components/Link";
import Tooltip from "../../../components/Tooltip";
import { useBlockExplorer, useWallet } from "../../../hooks";
import { PgTheme } from "../../../utils/pg";

export const Address = () => {
  const blockExplorer = useBlockExplorer();
  const wallet = useWallet();
  if (!wallet) return null;

  const walletPkStr = wallet.publicKey.toBase58();
  return (
    <Tooltip element="Your address">
      <AddressLink href={blockExplorer.getAddressUrl(walletPkStr)}>
        {walletPkStr}
      </AddressLink>
    </Tooltip>
  );
};

const AddressLink = styled(Link)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.bottom.address)};
  `}
`;
