import { PgTheme } from "../../utils/pg";
import { createSetting } from "../create";

export const font = createSetting({
  name: "Font",
  values: () => PgTheme.fonts.map((f) => f.family),
  getValue: () => PgTheme.font.family,
  setValue: (v) => PgTheme.set({ fontFamily: v }),
  // `onChange` isn't necessary because the whole app re-renders on font change
});
