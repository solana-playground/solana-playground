import { FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import { useDifferentBackground } from "../../hooks";
import { PgTheme } from "../../utils/pg";

export type TextKind = "default" | "info" | "warning" | "success" | "error";

interface TextProps {
  kind?: TextKind;
  IconEl?: ReactNode;
}

/** A text component that always have a different background than its parent */
const Text: FC<TextProps> = ({ IconEl, children, ...rest }) => {
  const { ref } = useDifferentBackground();

  return (
    <Wrapper ref={ref} IconEl={IconEl} {...rest}>
      {IconEl && <IconWrapper>{IconEl}</IconWrapper>}
      <ContentWrapper>{children}</ContentWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div<TextProps>`
  ${({ theme, kind, IconEl }) => {
    kind ??= "default";

    // Clone the default Text theme to not override the global object
    let text = structuredClone(theme.components.text.default);

    switch (kind) {
      case "info":
      case "warning":
      case "success":
      case "error":
        text.color = theme.colors.state[kind].color;
    }

    // Text kind specific overrides
    // NOTE: Overrides must come after setting the `TextProps` defaults
    text = PgTheme.overrideDefaults(
      text,
      theme.components.text.overrides?.[kind]
    );

    return css`
      ${PgTheme.convertToCSS(text)};

      ${!!IconEl &&
      `& div > svg {
      width: 1.5rem;
      height: 1.5rem;
      margin-right: 0.75rem;
    }`}
    `;
  }}
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentWrapper = styled.div`
  & > p:not(:first-child) {
    margin-top: 1rem;
  }
`;

export default Text;
