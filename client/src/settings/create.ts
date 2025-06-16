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
  try {
    const mod = require(`./${PgCommon.toKebabFromTitle(setting.name)}/Custom`);
    setting.CustomComponent ??= mod.default;
  } catch {}

  if (setting.id) {
    const id = setting.id;
    setting.getValue ??= () => PgSettings.get(id);
    setting.setValue ??= (v) => PgSettings.set(id, v);
    setting.onChange ??= PgSettings[
      id
        .split(".")
        .reduce(
          (acc, cur) => acc + PgCommon.capitalize(cur),
          "onDidChange"
        ) as keyof typeof PgSettings
    ] as typeof setting["onChange"];
  }

  return setting as Setting<I, V, C>;
};
