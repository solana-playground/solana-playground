import { useMemo } from "react";
import { useTheme } from "styled-components";

import Select from "../../../../../../components/Select";
import THEMES from "../../../../../../theme/themes";
import { PgThemeManager } from "../../../../../../utils/pg/theme";

const ThemeSetting = () => {
  const theme = useTheme();

  const options = useMemo(
    () => THEMES.map((t) => ({ value: t.name, label: t.name })),
    []
  );
  const value = useMemo(
    () => options.find((option) => option.value === theme.name),
    [theme.name, options]
  );

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        PgThemeManager.set({ themeName: newValue!.value });
      }}
    />
  );
};

export default ThemeSetting;
