import styled, { css } from "styled-components";

import { PgTheme } from "../../../../utils/pg";

interface CodeResultProps {
  index: number;
}

export const CodeResult = styled.pre<CodeResultProps>`
  ${({ theme, index }) => css`
    margin-top: 0.25rem;
    user-select: text;
    width: 100%;
    overflow-x: auto;
    padding: 0.75rem 0.5rem;
    background: ${index % 2 === 1
      ? theme.components.sidebar.right.default.otherBg
      : theme.components.sidebar.right.default.bg};
    border-radius: ${theme.default.borderRadius};

    ${PgTheme.getScrollbarCSS()};
  `}
`;
