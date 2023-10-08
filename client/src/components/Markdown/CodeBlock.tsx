import { DetailedHTMLProps, HTMLAttributes } from "react";
import styled, { css } from "styled-components";

import CopyButton from "../CopyButton";
import { useDifferentBackground } from "../../hooks";

const CodeBlock = (
  props: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>
) => {
  const code = (props as any).children[0].props.children[0];

  const { ref: wrapperRef } = useDifferentBackground<HTMLDivElement>();
  const { ref: copyButtonWrapperRef } =
    useDifferentBackground<HTMLDivElement>();

  return (
    <Wrapper ref={wrapperRef}>
      <CopyButtonWrapper ref={copyButtonWrapperRef}>
        <CopyButton copyText={code} />
      </CopyButtonWrapper>

      <pre {...props} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: relative;
    border-radius: ${theme.default.borderRadius};

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
