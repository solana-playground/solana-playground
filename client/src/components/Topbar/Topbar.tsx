import styled, { css } from "styled-components";

import { PgTheme } from "../../utils/pg";

const Topbar = styled.div`
  ${({ theme }) => css`
    position: sticky;
    top: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${theme.colors.default.border};

    ${PgTheme.convertToCSS(theme.components.topbar)};
  `}
`;

export default Topbar;
