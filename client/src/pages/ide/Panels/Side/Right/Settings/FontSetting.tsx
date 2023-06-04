import { useMemo } from "react";
import { useTheme } from "styled-components";

import Select from "../../../../../../components/Select";
import FONTS from "../../../../../../theme/fonts";
import { PgThemeManager } from "../../../../../../utils/pg/theme";

const FontSetting = () => {
  const theme = useTheme();

  const options = useMemo(
    () => FONTS.map((f) => ({ value: f.family, label: f.family })),
    []
  );

  return (
    <Select
      options={options}
      value={options.find((o) => o.value === theme.font.code.family)}
      onChange={(newValue) => {
        PgThemeManager.set({ fontFamily: newValue!.value });
      }}
    />
  );
};

export default FontSetting;
