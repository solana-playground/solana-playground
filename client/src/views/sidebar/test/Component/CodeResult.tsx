import styled, { css } from "styled-components";

import CodeBlock, { CodeBlockProps } from "../../../../components/CodeBlock";

interface CodeResultProps extends CodeBlockProps {
  index: number;
}

export const CodeResult = (props: CodeResultProps) => {
  return <StyledCodeBlock lang="json" {...props} />;
};

const StyledCodeBlock = styled(CodeBlock)<CodeResultProps>`
  ${({ theme, index }) => css`
    width: 100%;
    user-select: text;

    & pre {
      padding: 1rem 0.5rem;
      background: ${index % 2 === 1
        ? theme.components.sidebar.right.default.otherBg
        : theme.components.sidebar.right.default.bg} !important;
    }
  `}
`;
