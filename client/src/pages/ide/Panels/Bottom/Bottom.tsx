import styled, { css } from "styled-components";

import { Id } from "../../../../constants";
import { BOTTOM } from "../../../../views";
import { PgTheme } from "../../../../utils/pg";

const Bottom = () => (
  <Wrapper id={Id.BOTTOM}>
    {BOTTOM.map((Component, i) => (
      <Component key={i} />
    ))}
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    & > div {
      height: 100%;
      display: flex;
      align-items: center;
    }

    ${PgTheme.convertToCSS(theme.components.bottom.default)};
  `}
`;

export default Bottom;
