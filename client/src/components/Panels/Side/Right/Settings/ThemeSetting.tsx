import { useMemo, useState } from "react";
import { useTheme } from "styled-components";

import THEMES from "../../../../../theme/themes";
import Select from "../../../../Select";
import useSetTheme from "../../../../../theme/useSetTheme";
import { PgTheme } from "../../../../../theme/interface";

const ThemeSetting = () => {
  const [selectedTheme, setSelectedTheme] = useState<PgTheme>();
  const theme = useTheme();

  useSetTheme(selectedTheme);

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
      onChange={(newValue) =>
        setSelectedTheme(THEMES.find((t) => t.name === newValue?.value))
      }
    />
  );
};

export default ThemeSetting;
