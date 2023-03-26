import { useContext, useMemo } from "react";

import Select from "../../../../../../components/Select";
import FONTS from "../../../../../../theme/fonts";
import { MutThemeContext } from "../../../../../../theme/Provider";
import { PgThemeManager } from "../../../../../../utils/pg/theme";

const FontSetting = () => {
  const { font } = useContext(MutThemeContext);

  const options = useMemo(
    () => FONTS.map((f) => ({ value: f.family, label: f.family })),
    []
  );
  const value = useMemo(
    () => options.find((o) => o.value === font.family),
    [font.family, options]
  );

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        PgThemeManager.set({ fontFamily: newValue!.value });
      }}
    />
  );
};

export default FontSetting;
