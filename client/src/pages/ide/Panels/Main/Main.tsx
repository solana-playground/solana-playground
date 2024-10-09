import styled, { css } from "styled-components";

import Primary from "./Primary";
import Secondary from "./Secondary";
import { PgTheme } from "../../../../utils/pg";

const Main = () => (
  <Wrapper>
    <Primary />
    <Secondary />
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.default)};
  `}
`;

export default Main;
