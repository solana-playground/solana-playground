import { FC, ReactNode, useEffect, useRef } from "react";
import styled, { css, useTheme } from "styled-components";

import { PgCommon, PgTheme } from "../../utils/pg";

export type TextKind = "default" | "info" | "warning" | "success" | "error";

interface TextProps {
  kind?: TextKind;
  IconEl?: ReactNode;
}

/** A text component that always have a different background than its parent */
const Text: FC<TextProps> = ({ IconEl, children, ...rest }) => {
  const theme = useTheme();

  const ref = useRef<HTMLDivElement>(null);

  // Handle background(different background than its parent)
  useEffect(() => {
    if (!ref.current) return;

    let parent: HTMLElement | null | undefined = ref.current;
    let inheritedBg = "";
    while (1) {
      parent = parent?.parentElement;
      if (!parent) continue;

      const style = getComputedStyle(parent);
      if (style.backgroundImage !== "none") {
        inheritedBg = style.backgroundImage;
        break;
      }

      if (style.backgroundColor !== "rgba(0, 0, 0, 0)") {
        inheritedBg = style.backgroundColor;
        break;
      }
    }

    const textBg = theme.components.text.default.bg!;
    if (PgCommon.isColorsEqual(inheritedBg, textBg)) {
      const { bgPrimary, bgSecondary } = theme.colors.default;
      if (PgCommon.isColorsEqual(inheritedBg, bgPrimary)) {
        ref.current.style.background = bgSecondary;
      } else {
        ref.current.style.background = bgPrimary;
      }
    } else {
      ref.current.style.background = textBg;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.name]);

  return (
    <Wrapper ref={ref} IconEl={IconEl} {...rest}>
      <div>{IconEl}</div>
      <div>{children}</div>
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

      & > div {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      ${!!IconEl &&
      `& div > svg {
      width: 1.5rem;
      height: 1.5rem;
      margin-right: 0.75rem;
    }`}
    `;
  }}
`;

export default Text;
