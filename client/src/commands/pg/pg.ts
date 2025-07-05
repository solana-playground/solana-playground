import { PgCommon, PgSettings, PgTerminal } from "../../utils/pg";
import { createArgs, createCmd, createSubcmd } from "../create";

/** Common setting ID argument */
const settingIdArg = {
  name: "id",
  description: "Setting ID",
  values: () => PgSettings.all.map((s) => s.id).filter(PgCommon.isNonNullish),
} as const;

export const pg = createCmd({
  name: "pg",
  description: "Playground utilities",
  subcommands: [
    createSubcmd({
      name: "get",
      description: "Get setting value",
      args: createArgs([settingIdArg]),
      handle: (input) => {
        const value = PgSettings.get(input.args.id).getValue();
        PgTerminal.println(value);
      },
    }),

    createSubcmd({
      name: "set",
      description: "Set setting value",
      args: createArgs([
        settingIdArg,
        {
          name: "value",
          description: "Value to set",
          values: (token, tokens) => {
            // TODO: Find a better way to reliably get the setting ID because
            // passing an option before the third token would break this logic
            const id = tokens.at(2);
            if (!id) throw new Error("Setting ID not found in tokens");

            // Get setting
            const setting = PgSettings.get(id);

            // If `values` field is not specified, default to boolean
            if (!setting.values) return ["true", "false"];

            const values = PgCommon.callIfNeeded(setting.values).map((v) => {
              if (typeof v === "string") return v;
              if (typeof v === "object" && v.name && v.value) return v.name;

              // TODO: Objects with `values` field
              throw new Error(`Unimplemented setting value: ${v}`);
            });

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
        },
      ]),
      handle: (input) => {
        const { id, value } = input.args;
        const setting = PgSettings.get(id);

        let parsedVal = PgCommon.callIfNeeded(setting.values)?.find(
          (v) => v.name === value
        )?.value;
        if (parsedVal === undefined) {
          if (setting.custom) {
            try {
              parsedVal = setting.custom.parse(value);
            } catch {}
          }

          if (parsedVal === undefined) {
            parsedVal = setting.values ? value : value === "true";
          }
        }

        setting.setValue(parsedVal);
      },
    }),
  ],
});
