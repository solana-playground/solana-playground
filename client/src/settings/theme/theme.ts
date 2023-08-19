import ThemeSetting from "./ThemeSetting";
import { createSetting } from "../create";

export const theme = createSetting({
  name: "Theme",
  Component: ThemeSetting,
});
