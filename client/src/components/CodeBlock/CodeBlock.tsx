import { useState } from "react";
import styled, { css, useTheme } from "styled-components";

import CopyButton from "../CopyButton";
import { highlight } from "./highlight";
import { PgTheme } from "../../utils/pg";
import { useAsyncEffect, useDifferentBackground } from "../../hooks";

export interface CodeBlockProps {
  /** Code */
  children: string;
  /** Language or alias */
  lang?: string;
}

const CodeBlock = ({ lang, children, ...props }: CodeBlockProps) => {
  const code = children;

  const { ref: wrapperRef } = useDifferentBackground<HTMLDivElement>();
  const { ref: copyButtonWrapperRef } =
    useDifferentBackground<HTMLDivElement>();

  return (
    <Wrapper ref={wrapperRef} {...props}>
      <CopyButtonWrapper ref={copyButtonWrapperRef}>
        <CopyButton copyText={code} />
      </CopyButtonWrapper>

      <Code lang={lang}>{code}</Code>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: relative;
    border-radius: ${theme.default.borderRadius};

    & pre {
      border-radius: ${theme.default.borderRadius};
      font-family: ${theme.font.code.family};
      font-size: ${theme.font.code.size.medium};
      overflow: auto;

      ${PgTheme.getScrollbarCSS()};
    }

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

const Code = ({ children, lang }: CodeBlockProps) => {
  const [html, setHtml] = useState("");

  const theme = useTheme();

  useAsyncEffect(async () => {
    if (lang) {
      const highlightedHtml = await highlight(
        children,
        lang,
        PgTheme.convertToTextMateTheme(theme)
      );
      setHtml(highlightedHtml);
    } else {
      setHtml("");
    }
  }, [children, lang, theme]);

  if (!html) return <pre>{children}</pre>;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default CodeBlock;
