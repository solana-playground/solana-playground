import { useContext, useMemo } from "react";

import Select from "../../../../Select";
import FONTS from "../../../../../theme/fonts";
import { FONT_KEY, MutThemeContext } from "../../../../../theme/Provider";

const FontSetting = () => {
  const { font, setFont } = useContext(MutThemeContext);

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
        const newFont = FONTS.find((f) => f.family === newValue?.value);
        if (!newFont) return;

        localStorage.setItem(FONT_KEY, newFont.family);
        setFont(newFont);
      }}
    />
  );
};

export default FontSetting;
