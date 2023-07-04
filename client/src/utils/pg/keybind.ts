import { PgCommon } from "./common";
import type { Arrayable, Disposable } from "./types";

export class PgKeybind {
  /**
   * Add a keybind.
   *
   * @param keybinds keybinds to add
   * @returns a dispose function to clear the event
   */
  static add(
    keybinds: Arrayable<{
      keybind: string;
      handle: (ev: KeyboardEvent) => unknown;
    }>
  ): Disposable {
    const keybindsArray = PgCommon.toArray(keybinds);

    const handle = (ev: KeyboardEvent) => {
      const keybind = keybindsArray.find(({ keybind }) => {
        return this._isMatch(keybind, ev);
      });
      if (!keybind) return;

      ev.preventDefault();
      keybind.handle(ev);
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

        default:
          isMatch &&= key === ev.key.toUpperCase();
      }
    }

    return isMatch;
  }
}
