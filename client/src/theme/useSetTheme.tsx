import { useContext, useEffect } from "react";
import { useTheme } from "styled-components";

import { PgTheme } from "./interface";
import { MutThemeContext, THEME_KEY } from "./Provider";

const useSetTheme = (theme?: PgTheme) => {
  const { setTheme } = useContext(MutThemeContext);
  const currentTheme = useTheme();

  useEffect(() => {
    if (!theme || theme.name === currentTheme.name) return;

    localStorage.setItem(THEME_KEY, theme.name);
    setTheme(theme);
  }, [theme, currentTheme.name, setTheme]);
};

export default useSetTheme;
