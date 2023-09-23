import { PgCommon, RequiredKey } from "../utils/pg";

/** UI setting parameter */
interface SettingParam {
  /** Name of the setting */
  name: string;
  /** Setting component, default to `./setting-name/Component` */
  Component?: () => JSX.Element;
  /** Help tooltip */
  tooltip?: {
    /** Tooltip text */
    text: string;
    /** Max allowed with for the tooltip text */
    maxWidth: string;
  };
  /** Whether the `Element` is a `Checkbox` */
  isCheckBox?: boolean;
}

/** UI Setting */
export type Setting = RequiredKey<SettingParam, "Component">;

/**
 * Create a UI setting.
 *
 * @param setting UI setting
 * @returns the setting with correct types
 */
export const createSetting = (setting: SettingParam) => {
  setting.Component ??= require(`./${PgCommon.toKebabFromTitle(
    setting.name
  )}/Component`).default;
  return setting as Setting;
};
