import { createContext, FC, useEffect, useState } from "react";
import styled, { css, ThemeProvider } from "styled-components";

import THEMES from "./themes";
import FONTS from "./fonts";
import { PgFont, PgThemeManager } from "../utils/pg/theme";
import { EventName } from "../constants/event";
import { useSetStatic } from "../hooks/useSetStatic";

interface MutThemeContextProps {
  font: PgFont;
}

export const MutThemeContext = createContext<MutThemeContextProps>(
  {} as MutThemeContextProps
);

const MutThemeProvider: FC = ({ children }) => {
  const themeManager = PgThemeManager.create(THEMES, FONTS);

  const [theme, setTheme] = useState(themeManager.theme);
  const [font, setFont] = useState(themeManager.font);

  useSetStatic(setTheme, EventName.THEME_SET);
  useSetStatic(setFont, EventName.THEME_FONT_SET);

  // Update theme.font when theme or font changes
  useEffect(() => {
    if (theme && theme.font.code.family !== font.family) {
      setTheme((t) => ({ ...t, font: { code: font, other: t.font?.other } }));
    }
  }, [theme, font]);

  return (
    <MutThemeContext.Provider value={{ font }}>
      <ThemeProvider theme={theme}>
        <Wrapper>{children}</Wrapper>
      </ThemeProvider>
    </MutThemeContext.Provider>
  );
};

// Set default theme values
const Wrapper = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bgPrimary};
    color: ${theme.colors.default.textPrimary};
    font-family: ${theme.font.code.family};
    font-size: ${theme.font.code.size.medium};

    & svg {
      color: ${theme.colors.default.textSecondary};
      transition: color ${theme.transition.duration.short}
        ${theme.transition.type};
    }

    & ::selection {
      background-color: ${theme.colors.default.primary +
      theme.transparency.medium};
    }
  `}
`;

export default MutThemeProvider;
