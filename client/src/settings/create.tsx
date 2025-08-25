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
    const id = setting.id.split(".");
    setting.getValue ??= () => PgCommon.getValue(PgSettings, id);
    setting.setValue ??= (v) => PgCommon.setValue(PgSettings, id, v);
    setting.onChange ??= PgSettings[
      id.reduce(
        (acc, cur) => acc + PgCommon.capitalize(cur),
        "onDidChange"
      ) as keyof typeof PgSettings
    ] as typeof setting["onChange"];
    // If `id` is "wallet.automaticAirdrop", `name` will be "Automatic airdrop"
    setting.name ??= PgCommon.toTitleFromCamel(id.at(-1)!)
      .split(" ")
      .map((word, i) => (i ? word.toLowerCase() : word))
      .join(" ");
  }

  if (!setting.name) {
    throw new Error(
      "At least one of the following setting fields must be set: `id`, `name`"
    );
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
