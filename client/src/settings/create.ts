/** UI Setting */
export interface Setting {
  /** Name of the setting */
  name: string;
  /** Setting component */
  Component: () => JSX.Element;
  /** Help tooltip */
  tooltip?: {
    /** Tooltip text */
    text: string;
    /** Max allowed with for the tooltip text */
    maxWidth: string;
  };
  /** Whether the `Element` is a `CheckBox` */
  isCheckBox?: boolean;
}

/**
 * Create a UI setting.
 *
 * @param setting UI setting
 * @returns the setting with correct types
 */
export const createSetting = (setting: Setting) => setting;
