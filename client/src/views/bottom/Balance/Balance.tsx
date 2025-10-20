import styled, { css } from "styled-components";

import Tooltip from "../../../components/Tooltip";
import { useBalance } from "../../../hooks";
import { PgTheme } from "../../../utils/pg";

export const Balance = () => {
  const balance = useBalance();
  if (typeof balance !== "number") return null;

  return (
    <Tooltip element="Current balance">
      <BalanceText>{`${balance} SOL`}</BalanceText>
    </Tooltip>
  );
};

const BalanceText = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.bottom.balance)};
  `}
`;
