import { CallableJSX, Disposable, Getable, PgCommon } from "../utils/pg";
import type { TooltipProps } from "../components/Tooltip";

/** UI setting parameter */
interface SettingParam<T> {
  /** Name of the setting */
  name: string;
  /** Help tooltip */
  tooltip?: TooltipProps;
  /**
   * Possible values for the settings.
   *
   * If this is not set, the setting is assumed to be a checkbox.
   */
  values?: Getable<readonly Values<T>[]>;
  /** Get current value. */
  getValue: () => T;
  /** Set current value. */
  setValue: (v: T) => unknown;
  /** Setting's `onChange` function (necessary for re-rendering on change) */
  onChange?: (cb: (v: T) => void) => Disposable;
  /**
   * Custom component to set custom values for the setting.
   *
   * This is set automatically if `Custom.tsx` file inside the setting's
   * directory exists.
   */
  CustomComponent?: CallableJSX;
}

/** Possible setting values */
type Values<T> =
  | T
  | { name: string; value: T }
  | { name: string; values: Values<T[]> };

/** UI Setting */
export type Setting<T = any> = SettingParam<T>;

/**
 * Create a UI setting.
 *
 * @param setting UI setting
 * @returns the setting with correct types
 */
export const createSetting = <T>(setting: SettingParam<T>) => {
  try {
    const mod = require(`./${PgCommon.toKebabFromTitle(setting.name)}/Custom`);
    setting.CustomComponent ??= mod.default;
  } finally {
    return setting as Setting<T>;
  }
};
