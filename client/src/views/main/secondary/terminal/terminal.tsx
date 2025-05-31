import { Clear } from "../../../../components/Icons";
import { PgTerminal } from "../../../../utils/pg";
import { createMainSecondaryPage } from "../create";

export const terminal = createMainSecondaryPage({
  name: "Terminal",
  keybind: "Ctrl+`",
  getIsFocused: PgTerminal.isFocused,
  focus: PgTerminal.focus,
  actions: [
    {
      name: "Clear",
      keybind: "Ctrl+L",
      icon: <Clear />,
      run: PgTerminal.clear,
    },
  ],
});
