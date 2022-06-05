import styled, { css } from "styled-components";

import Modal from "../../components/Modal";
import Panels from "../../components/Panels";

const IDE = () => (
  <Wrapper>
    <Panels />
    <Modal />
  </Wrapper>
);

// Set default theme values
const Wrapper = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bgPrimary};
    color: ${theme.colors.default.textPrimary};
    font-family: ${theme.font?.family};
    font-size: ${theme.font?.size.medium};

    & ::selection {
      background-color: ${theme.colors.default.primary +
      theme.transparency?.medium};
    }
  `}
`;

export default IDE;
