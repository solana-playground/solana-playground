import { ComponentPropsWithoutRef, forwardRef, ReactNode } from "react";
import styled, { css } from "styled-components";

import { useDifferentBackground } from "../../hooks";
import { PgTheme } from "../../utils";

export type TextKind = "default" | "info" | "warning" | "success" | "error";

export interface TextProps extends ComponentPropsWithoutRef<"div"> {
  kind?: TextKind;
  icon?: ReactNode;
}

/** A text component that always have a different background than its parent */
const Text = forwardRef<HTMLDivElement, TextProps>(
  ({ icon, children, ...props }, refProp) => {
    const ref = useDifferentBackground();

    return (
      <Wrapper ref={refProp ?? ref} {...props}>
        {icon && <IconWrapper>{icon}</IconWrapper>}
        <ContentWrapper>{children}</ContentWrapper>
      </Wrapper>
    );
  }
);

const Wrapper = styled.div<TextProps>`
  ${({ kind, theme }) => {
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
      ${PgTheme.toCss(text)};
    `;
  }}
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  & > * {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.75rem;
  }
`;

const ContentWrapper = styled.div`
  & > p:not(:first-child) {
    margin-top: 1rem;
  }
`;

export default Text;
