import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import { balanceAtom } from "../../../state";

const Balance = () => {
  const [balance] = useAtom(balanceAtom);

  if (balance === null || balance === undefined) return null;

  const uiBalance = balance === 0 ? 0 : balance.toFixed(3);

  return <Wrapper>{uiBalance} SOL</Wrapper>;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
    font-weight: bold;
    font-size: ${theme.font?.size.large};
    color: ${theme.colors.default.textSecondary};
  `}
`;

export default Balance;
