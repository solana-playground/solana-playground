import { PgCommon, PgSettings, PgTerminal } from "../../utils";
import { createArgs, createCmd, createSubcmd } from "../create";

/** Common setting ID argument */
const idArg = {
  name: "id",
  description: "Setting ID",
  values: () => PgSettings.all.map((s) => s.id),
} as const;

export const setting = createCmd({
  name: "setting",
  description: "Manage playground settings",
  subcommands: [
    createSubcmd({
      name: "get",
      description: "Get setting value",
      args: createArgs([idArg]),
      handle: (input) => {
        const value = getSetting(input.args.id).getValue();
        PgTerminal.println(value);
      },
    }),

    createSubcmd({
      name: "set",
      description: "Set setting value",
      args: createArgs([
        idArg,
        {
          name: "value",
          description: "Value to set",
          values: (token, tokens) => {
            // TODO: Find a better way to reliably get the setting ID because
            // passing an option before the third token would break this logic
            const id = tokens.at(2);
            if (!id) throw new Error("Setting ID not found in tokens");

            // Get setting
            const setting = getSetting(id);

            // If `values` field is not specified, default to boolean
            if (!setting.values) return ["true", "false"];

            // Normalize values
            const values = PgCommon.callIfNeeded(setting.values).flatMap(
              (v) => {
                if (typeof v === "string") return v;
                if (typeof v === "object" && v.name && v.value) return v.name;
                if (typeof v === "object" && v.values) return v.values;

                throw new Error(`Unimplemented setting value: ${v}`);
              }
            );

            // If the setting has a custom value parser, allow the current
            // token to be used as a setting value after a validation check
            if (setting.custom) {
              try {
                setting.custom.parse(token);
                values.push(token);
              } catch {}
            }

            return values;
          },
          parse: (token, tokens) => {
            // TODO: Find a better way to reliably get the setting ID because
            // passing an option before the third token would break this logic
            const id = tokens.at(2);
            if (!id) throw new Error("Setting ID not found in tokens");

            const setting = getSetting(id);
            const value = token;
            const namedValue = PgCommon.callIfNeeded(setting.values)?.find(
              (v) => v.name === value
            )?.value;
            if (namedValue) return namedValue;

            if (setting.custom) {
              try {
                return setting.custom.parse(value);
              } catch {}
            }

            return setting.values ? value : value === "true";
          },
        },
      ]),
      handle: (input) => getSetting(input.args.id).setValue(input.args.value),
    }),
  ],
});

/**
 * Get the setting's implementation from its id.
 *
 * @param id setting id
 * @throws if the setting is not found
 * @returns the full setting object
 */
const getSetting = (id: string) => {
  const setting = PgSettings.all.find((s) => s.id === id);
  if (!setting) throw new Error(`Setting not found: ${id}`);
  return setting;
};
