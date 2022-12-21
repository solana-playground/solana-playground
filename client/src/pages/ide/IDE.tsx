import styled, { css } from "styled-components";

import Panels from "../../components/Panels";
import ModalWrapper from "../../components/Modal/ModalWrapper";
import Statics from "../../components/Statics";
import ClientHelper from "../../components/ClientHelper";

const IDE = () => (
  <Wrapper>
    <Panels />
    <ModalWrapper />
    <Statics />
    <ClientHelper />
  </Wrapper>
);

// Set default theme values
const Wrapper = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bgPrimary};
    color: ${theme.colors.default.textPrimary};
    font-family: ${theme.font?.code?.family};
    font-size: ${theme.font?.code?.size.medium};

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
