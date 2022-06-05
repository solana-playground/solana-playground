import { ChangeEvent, useCallback, useContext } from "react";

import Select from "../../../../Select";
import FONTS from "../../../../../theme/fonts";
import { FONT_KEY, MutThemeContext } from "../../../../../theme/Provider";

const FontSetting = () => {
  const { font, setFont } = useContext(MutThemeContext);

  const changeFont = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newFont = FONTS.find((f) => f.family === e.target.value);
      if (!newFont) return;

      localStorage.setItem(FONT_KEY, newFont.family);
      setFont(newFont);
    },
    [setFont]
  );

  return (
    <Select value={font?.family} onChange={changeFont}>
      {FONTS.map((f, i) => (
        <option key={i}>{f.family}</option>
      ))}
    </Select>
  );
};

export default FontSetting;
