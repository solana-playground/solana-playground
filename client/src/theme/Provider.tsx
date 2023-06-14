import { FC, useEffect, useState } from "react";
import styled, {
  css,
  ThemeProvider as StyledThemeProvider,
} from "styled-components";

import THEMES from "./themes";
import FONTS from "./fonts";
import { Font, PgTheme, ThemeReady } from "../utils/pg/theme";
import { EventName } from "../constants/event";
import { useSetStatic } from "../hooks/useSetStatic";

const ThemeProvider: FC = ({ children }) => {
  const [theme, setTheme] = useState<ThemeReady>();
  const [font, setFont] = useState<Font>();

  useSetStatic(setTheme, EventName.THEME_SET);
  useSetStatic(setFont, EventName.THEME_FONT_SET);

  // Create initial theme
  useEffect(() => {
    PgTheme.create(THEMES, FONTS);
  }, []);

  // Update theme.font when theme or font changes
  useEffect(() => {
    if (theme && font && theme.font.code.family !== font.family) {
      setTheme((t) => t && { ...t, font: { code: font, other: t.font.other } });
    }
  }, [theme, font]);

  if (!theme || !font) return null;

  return (
    <StyledThemeProvider theme={theme}>
      <Wrapper>{children}</Wrapper>
    </StyledThemeProvider>
  );
};

// Set default theme values
const Wrapper = styled.div`
  ${({ theme }) => css`
    background: ${theme.colors.default.bgPrimary};
    color: ${theme.colors.default.textPrimary};
    font-family: ${theme.font.code.family};
    font-size: ${theme.font.code.size.medium};

    & svg {
      transition: color ${theme.default.transition.duration.short}
        ${theme.default.transition.type};
    }

    & ::selection {
      background: ${theme.colors.default.primary +
      theme.default.transparency.medium};
    }
  `}
`;

export default ThemeProvider;
