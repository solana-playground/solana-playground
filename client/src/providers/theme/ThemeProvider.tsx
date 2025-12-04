import { FC, useEffect, useState } from "react";
import styled, {
  css,
  ThemeProvider as StyledThemeProvider,
} from "styled-components";

import { FONTS, THEMES } from "../../themes";
import { PgCommon } from "../../utils/pg/common";
import { PgTheme, Theme } from "../../utils/pg/theme";

export const ThemeProvider: FC = ({ children }) => {
  const [theme, setTheme] = useState<Theme>();

  // Create the initial theme
  useEffect(() => {
    PgTheme.create(THEMES, FONTS);
  }, []);

  // Set theme when the current theme name or font family changes
  useEffect(() => {
    return PgCommon.batchChanges(
      () => setTheme(PgTheme.theme),
      [PgTheme.onDidChangeThemeName, PgTheme.onDidChangeFontFamily]
    ).dispose;
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

    & ::selection {
      background: ${theme.colors.default.primary +
      theme.default.transparency.medium};
    }
  `}
`;
