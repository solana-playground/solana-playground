import { PgCommon, PgSettings, Setting, SettingParam } from "../utils/pg";

/**
 * Create a UI setting.
 *
 * @param setting UI setting
 * @returns the setting with correct types
 */
export const createSetting = <I extends string = "", V = boolean, C = never>(
  setting: SettingParam<I, V, C>
) => {
  if (setting.id) {
    const id = setting.id;
    setting.getValue ??= () => {
      return id.split(".").reduce((acc, cur) => acc[cur], PgSettings as any);
    };
    setting.setValue ??= (v) => {
      const fields = id.split(".");
      const parentObj = fields
        .slice(0, -1)
        .reduce((acc, cur) => acc[cur], PgSettings as any);
      const lastField = fields.at(-1)!;
      parentObj[lastField] = v;
    };
    setting.onChange ??= PgSettings[
      id
        .split(".")
        .reduce(
          (acc, cur) => acc + PgCommon.capitalize(cur),
          "onDidChange"
        ) as keyof typeof PgSettings
    ] as typeof setting["onChange"];
  }

  try {
    if (setting.custom) {
      const mod = require(`./${PgCommon.toKebabFromTitle(
        setting.name
      )}/Custom`);
      setting.custom.Component ??= mod.default;
    }
  } catch {}

  return setting as Setting<I, V, C>;
};
