import { useMemo } from "react";
import { useTheme } from "styled-components";

import Select from "../../components/Select";
import { PgTheme } from "../../utils/pg";

const ThemeSetting = () => {
  const theme = useTheme();

  const options = useMemo(
    () => PgTheme.themes.map((t) => ({ value: t.name, label: t.name })),
    []
  );

  return (
    <Select
      options={options}
      value={options.find((option) => option.value === theme.name)}
      onChange={(newValue) => {
        PgTheme.set({ themeName: newValue!.value });
      }}
    />
  );
};

export default ThemeSetting;
