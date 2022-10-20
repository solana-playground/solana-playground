import styled, { css } from "styled-components";

import Panels from "../../components/Panels";
import Modal from "../../components/Modal";
import Statics from "../../components/Statics";
import ClientHelper from "../../components/ClientHelper";

const IDE = () => (
  <Wrapper>
    <Panels />
    <Modal />
    <Statics />
    <ClientHelper />
  </Wrapper>
);

// Set default theme values
const Wrapper = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bgPrimary};
    color: ${theme.colors.default.textPrimary};
    font-family: ${theme.font?.family};
    font-size: ${theme.font?.size.medium};

    & svg {
      color: ${theme.colors.default.textSecondary};
      transition: color ${theme.transition?.duration.short}
        ${theme.transition?.type};
    }

    & ::selection {
      background-color: ${theme.colors.default.primary +
      theme.transparency?.medium};
    }
  `}
`;

export default IDE;
