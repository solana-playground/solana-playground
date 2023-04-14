import { DetailedHTMLProps, HTMLAttributes } from "react";
import styled, { css } from "styled-components";

import CopyButton from "../CopyButton";

const CodeBlock = ({
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>) => {
  const code = (props as any).node.children[0].children[0].value;

  return (
    <Wrapper>
      <CopyButtonWrapper>
        <CopyButton copyText={code} />
      </CopyButtonWrapper>
      <pre {...props}>{children}</pre>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: relative;

    & > :first-child {
      opacity: 0;
      transition: opacity ${theme.default.transition.duration.short}
        ${theme.default.transition.type};
    }

    &:hover > :first-child {
      opacity: 1;
    }
  `}
`;

const CopyButtonWrapper = styled.div`
  ${({ theme }) => css`
    position: absolute;
    top: 0.5rem;
    right: 1rem;
    background: ${theme.components.tutorial.tutorialPage.bg};
    border-radius: ${theme.default.borderRadius};
    box-shadow: ${theme.default.boxShadow};

    & button {
      padding: 0.375rem;

      & > svg {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
  `}
`;

export default CodeBlock;
