import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import { uiBalanceAtom } from "../../state";
import { PgThemeManager } from "../../utils/pg/theme";

const Balance = () => {
  const [balance] = useAtom(uiBalanceAtom);

  if (balance === null || balance === undefined) return null;

  const uiBalance = balance === 0 ? 0 : balance.toFixed(3);

  return <Wrapper>{uiBalance} SOL</Wrapper>;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.main.balance)};
  `}
`;

export default Balance;
