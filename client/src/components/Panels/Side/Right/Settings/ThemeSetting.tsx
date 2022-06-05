import { ChangeEvent, useCallback, useState } from "react";
import { useTheme } from "styled-components";

import Theme from "../../../../../theme/interface";
import THEMES from "../../../../../theme/themes";
import Select from "../../../../Select";
import useSetTheme from "../../../../../theme/useSetTheme";

const ThemeSetting = () => {
  const [selectedTheme, setSelectedTheme] = useState<Theme>();
  const theme = useTheme() as Theme;

  const changeTheme = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(THEMES.find((t) => t.name === e.target.value));
  }, []);

  useSetTheme(selectedTheme);

  return (
    <Select value={theme?.name} onChange={changeTheme}>
      {THEMES.map((t, i) => (
        <option key={i}>{t.name}</option>
      ))}
    </Select>
  );
};

export default ThemeSetting;
