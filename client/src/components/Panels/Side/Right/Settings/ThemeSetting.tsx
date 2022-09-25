import { ChangeEvent, useCallback, useState } from "react";
import { useTheme } from "styled-components";

import THEMES from "../../../../../theme/themes";
import Select from "../../../../Select";
import useSetTheme from "../../../../../theme/useSetTheme";
import { PgTheme } from "../../../../../theme/interface";

const ThemeSetting = () => {
  const [selectedTheme, setSelectedTheme] = useState<PgTheme>();
  const theme = useTheme();

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
