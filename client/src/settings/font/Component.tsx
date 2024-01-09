import { useMemo } from "react";
import { useTheme } from "styled-components";

import Select from "../../components/Select";
import { PgTheme } from "../../utils/pg";

const FontSetting = () => {
  const theme = useTheme();

  const options = useMemo(
    () => PgTheme.fonts.map((f) => ({ value: f.family, label: f.family })),
    []
  );

  return (
    <Select
      options={options}
      value={options.find((option) => {
        return PgTheme.addFallbackFont(option.value) === theme.font.code.family;
      })}
      onChange={(newValue) => {
        PgTheme.set({ fontFamily: newValue!.value });
      }}
    />
  );
};

export default FontSetting;
