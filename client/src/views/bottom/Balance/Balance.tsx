import styled, { css } from "styled-components";

import Tooltip from "../../../components/Tooltip";
import { useBalance } from "../../../hooks";
import { PgTheme } from "../../../utils/pg";

export const Balance = () => {
  const { balance } = useBalance();

  if (balance === undefined || balance === null) return null;

  return (
    <>
      <Seperator>|</Seperator>

      <Tooltip element="Current balance">
        <BalanceText>{`${balance} SOL`}</BalanceText>
      </Tooltip>
    </>
  );
};

const Seperator = styled.span`
  margin: 0 0.75rem;
`;

const BalanceText = styled.span`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.bottom.balance)};
  `}
`;
