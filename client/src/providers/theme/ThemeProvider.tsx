import { FC, useEffect, useState } from "react";
import styled, {
  css,
  ThemeProvider as StyledThemeProvider,
} from "styled-components";

import { FONTS, THEMES } from "../../themes";
import { PgTheme, Theme } from "../../utils/pg/theme";
import { useSetStatic } from "../../hooks/useSetStatic";

export const ThemeProvider: FC = ({ children }) => {
  const [theme, setTheme] = useState<Theme>();

  useSetStatic(setTheme, PgTheme.events.THEME_SET);

  // Create initial theme
  useEffect(() => {
    PgTheme.create(THEMES, FONTS);
  }, []);

  if (!theme) return null;

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
