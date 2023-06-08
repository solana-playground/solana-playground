import styled, { css } from "styled-components";

import { PgThemeManager } from "../../utils/pg/theme";
import { useBalance } from "../../hooks";

const Balance = () => {
  const { balance } = useBalance();

  if (balance === null) return null;

  return <Wrapper>{balance === 0 ? 0 : balance.toFixed(3)} SOL</Wrapper>;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.main.balance)};
  `}
`;

export default Balance;
