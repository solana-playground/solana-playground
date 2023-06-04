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

  return (
    <Select
      options={options}
      value={options.find((option) => option.value === theme.name)}
      onChange={(newValue) => {
        PgThemeManager.set({ themeName: newValue!.value });
      }}
    />
  );
};

export default ThemeSetting;
