import { useMemo } from "react";
import { useTheme } from "styled-components";

import Select from "../../components/Select";
import { PgCommon, PgTheme } from "../../utils/pg";

const ThemeSetting = () => {
  const options = useMemo(() => {
    const [darkThemes, lightThemes] = PgCommon.filterWithRemaining(
      PgTheme.themes,
      (t) => t.isDark
    );
    return [
      {
        label: "Dark",
        options: darkThemes.map((t) => ({ label: t.name, value: t.name })),
      },
      {
        label: "Light",
        options: lightThemes.map((t) => ({ label: t.name, value: t.name })),
      },
    ];
  }, []);

  const theme = useTheme();
  const value = useMemo(() => {
    for (const option of options) {
      const val = option.options.find((option) => option.value === theme.name);
      if (val) return val;
    }
  }, [theme.name, options]);

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => PgTheme.set({ themeName: newValue!.value })}
    />
  );
};

export default ThemeSetting;
