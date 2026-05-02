import { PgCommon, PgSettings, Setting, SettingParam } from "../utils";

/**
 * Create a UI setting.
 *
 * @param setting UI setting
 * @returns the setting with correct types
 */
export const createSetting = <
  I extends string,
  V = boolean,
  C = never,
  D = boolean
>(
  setting: SettingParam<I, V, C, D>
) => {
  const id = setting.id.split(".");

  // If `id` is "wallet.automaticAirdrop", `name` will be "Automatic airdrop"
  setting.name ??= PgCommon.toTitleFromCamel(id.at(-1)!)
    .split(" ")
    .map((word, i) => (i ? word.toLowerCase() : word))
    .join(" ");

  if (!(setting.getValue && setting.setValue && setting.onChange)) {
    setting.getValue = () => PgCommon.getValue(PgSettings, id);
    setting.setValue = (v) => PgCommon.setValue(PgSettings, id, v);
    setting.onChange = PgSettings[
      id.reduce(
        (acc, cur) => acc + PgCommon.capitalize(cur),
        "onDidChange"
      ) as keyof typeof PgSettings
    ] as typeof setting["onChange"];

    // Default value
    if (!setting.default) {
      if (!setting.values) setting.default = false as D;
      else throw new Error("Setting must have a default value");
    }
  }

  // Custom value
  try {
    if (setting.custom) {
      const mod = require(`./${PgCommon.toKebabFromTitle(
        setting.name
      )}/Custom`);
      setting.custom.Component ??= mod.default;
    }
  } catch {}

  return setting as D extends V | C ? Setting<I, V, C> : never;
};
