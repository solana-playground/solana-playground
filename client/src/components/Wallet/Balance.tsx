import styled, { css } from "styled-components";

import { PgTheme } from "../../utils/pg";
import { useBalance } from "../../hooks";

const Balance = () => {
  const { balance } = useBalance();

  if (balance === null) return null;

  return <Wrapper>{balance === 0 ? 0 : balance.toFixed(3)} SOL</Wrapper>;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.main.balance)};
  `}
`;

export default Balance;
