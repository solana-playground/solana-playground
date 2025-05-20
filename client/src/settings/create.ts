import { PgCommon, PgSettings, Setting, SettingParam } from "../utils/pg";

/**
 * Create a UI setting.
 *
 * @param setting UI setting
 * @returns the setting with correct types
 */
export const createSetting = <I extends string = "", V = boolean>(
  setting: SettingParam<I, V>
) => {
  try {
    const mod = require(`./${PgCommon.toKebabFromTitle(setting.name)}/Custom`);
    setting.CustomComponent ??= mod.default;
  } catch {}

  if (setting.id) {
    const fields = setting.id.split(".");
    setting.getValue ??= () => {
      return fields.reduce((acc, cur) => acc[cur], PgSettings as any);
    };
    setting.setValue ??= (v) => {
      const parentObj = fields
        .slice(0, -1)
        .reduce((acc, cur) => acc[cur], PgSettings as any);
      const lastField = fields.at(-1)!;
      parentObj[lastField] = v;
    };
    setting.onChange ??= PgSettings[
      fields.reduce(
        (acc, cur) => acc + PgCommon.capitalize(cur),
        "onDidChange"
      ) as keyof typeof PgSettings
    ] as typeof setting["onChange"];
  }

  return setting as Setting<I, V>;
};
