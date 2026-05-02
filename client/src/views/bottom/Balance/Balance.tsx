import styled from "styled-components";

import Tooltip from "../../../components/Tooltip";
import { useBalance } from "../../../hooks";

export const Balance = () => {
  const balance = useBalance();
  if (typeof balance !== "number") return null;

  return (
    <Tooltip element="Current balance">
      <BalanceText>{`${balance} SOL`}</BalanceText>
    </Tooltip>
  );
};

const BalanceText = styled.span``;
