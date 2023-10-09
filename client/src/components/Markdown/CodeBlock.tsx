import { DetailedHTMLProps, HTMLAttributes, useState } from "react";
import styled, { css, useTheme } from "styled-components";

import CopyButton from "../CopyButton";
import { highlight } from "./highlight";
import { NullableJSX, PgTheme } from "../../utils/pg";
import { useAsyncEffect, useDifferentBackground } from "../../hooks";

const CodeBlock = (
  props: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>
) => {
  const codeProps = (props as any).children[0].props;
  const lang = codeProps.className?.split("-")?.at(1);
  const code = codeProps.children[0];

  const { ref: wrapperRef } = useDifferentBackground<HTMLDivElement>();
  const { ref: copyButtonWrapperRef } =
    useDifferentBackground<HTMLDivElement>();

  return (
    <Wrapper ref={wrapperRef}>
      <CopyButtonWrapper ref={copyButtonWrapperRef}>
        <CopyButton copyText={code} />
      </CopyButtonWrapper>

      <Code lang={lang} Fallback={<pre {...props} />}>
        {code}
      </Code>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: relative;
    border-radius: ${theme.default.borderRadius};

    & pre {
      background: transparent !important;
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

interface CodeProps {
  /** Code */
  children: string;
  /** Language or alias */
  lang: string | null;
  /** Fallback JSX */
  Fallback: NullableJSX;
}

const Code = ({ children, lang, Fallback }: CodeProps) => {
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

  if (!html) return Fallback;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default CodeBlock;
