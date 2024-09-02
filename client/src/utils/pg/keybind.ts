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
    const keybinds =
      typeof args[0] === "string"
        ? { keybind: args[0], handle: args[1]! }
        : args[0];

    const keybindsArray = PgCommon.toArray(keybinds);

    const handle = (ev: KeyboardEvent) => {
      const keybind = keybindsArray.find(({ keybind }) => {
        return this._isMatch(keybind, ev);
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

  /**
   * Get whether the given `keybind` and pressed keys from the `ev` match.
   *
   * @param keybind keybind string
   * @param ev keyboard event
   * @returns whether the given keybind and pressed keys match
   */
  private static _isMatch(keybind: string, ev: KeyboardEvent) {
    let isMatch = true;

    const keys = keybind.toUpperCase().replaceAll(" ", "").split("+");
    for (const key of keys) {
      switch (key) {
        case "CTRL":
        case "CONTROL":
          isMatch &&= ev.ctrlKey || ev.metaKey;
          break;

        case "ALT":
          isMatch &&= ev.altKey;
          break;

        case "SHIFT":
          isMatch &&= ev.shiftKey;
          break;

        case "SPACE":
          isMatch &&= ev.key === " ";
          break;

        default:
          isMatch &&= key === ev.key.toUpperCase();
      }
    }

    return isMatch;
  }
}
