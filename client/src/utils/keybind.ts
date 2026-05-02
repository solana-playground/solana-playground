import { PgCommon } from "./common";
import type { Arrayable, Disposable } from "./types";

/** Keys of the keybind */
type Keybind = string;

/** Handler callback for the keybind */
type HandleKeybindCb = (ev: KeyboardEvent) => unknown;

/** Handler for the keybind */
type HandleKeybind =
  | HandleKeybindCb
  | { handle: HandleKeybindCb; opts?: { noPreventDefault?: boolean } };

/** A single keybind parameters */
type SingleKeybind = [Keybind, HandleKeybind];

/** Multiple keybinds parameters */
type MultipleKeybinds = [
  Arrayable<{ keybind: Keybind; handle: HandleKeybind }>
];

export class PgKeybind {
  /**
   * Add keybind(s).
   *
   * @param args keybind(s) to add
   * @returns a dispose function to clear the event
   */
  static add(...args: SingleKeybind | MultipleKeybinds): Disposable {
    // Normalize keybinds
    const keybinds = PgCommon.toArray(
      typeof args[0] === "string"
        ? { keybind: args[0], handle: args[1]! }
        : args[0]
    );

    const handle = (ev: KeyboardEvent) => {
      const keybind = keybinds.find(({ keybind }) => {
        return keybind
          .toUpperCase()
          .replaceAll(" ", "")
          .split("+")
          .map((key) => {
            switch (key) {
              case "CTRL":
                return ev.ctrlKey || ev.metaKey;
              case "ALT":
                return ev.altKey;
              case "SHIFT":
                return ev.shiftKey;
              case "SPACE":
                return ev.key === " ";
              case "`":
                // Chromium sets `ev.key` to "Unidentified" on "CTRL+`"
                return ev.code === "Backquote";
              default:
                return key === ev.key.toUpperCase();
            }
          })
          .reduce((acc, cur) => acc && cur, true);
      });
      if (!keybind) return;

      if (typeof keybind.handle === "function") {
        keybind.handle(ev);
        ev.preventDefault();
      } else {
        keybind.handle.handle(ev);
        if (!keybind.handle.opts?.noPreventDefault) ev.preventDefault();
      }
    };

    document.addEventListener("keydown", handle);
    return { dispose: () => document.removeEventListener("keydown", handle) };
  }
}
