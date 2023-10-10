import styled, { css } from "styled-components";

import CodeBlock, { CodeBlockProps } from "../../../../components/CodeBlock";
import { PgTheme } from "../../../../utils/pg";

interface CodeResultProps extends CodeBlockProps {
  index: number;
}

export const CodeResult = (props: CodeResultProps) => {
  return <StyledCodeBlock lang="json" {...props} />;
};

const StyledCodeBlock = styled(CodeBlock)`
  ${({ theme, index }: any) => css`
    margin-top: 0.25rem;
    user-select: text;
    width: 100%;
    overflow-x: auto;

    & pre {
      width: 100%;
      padding: 1rem 0.5rem;
      background: ${index % 2 === 1
        ? theme.components.sidebar.right.default.otherBg
        : theme.components.sidebar.right.default.bg} !important;
    }

    ${PgTheme.getScrollbarCSS()};
  `}
`;
