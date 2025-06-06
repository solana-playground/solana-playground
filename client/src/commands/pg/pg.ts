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
        const value = PgSettings.get(input.args.id);
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
          values: (_, tokens) => {
            // TODO: Find a better way to reliably get the setting ID because
            // passing an option before the third token would break this logic
            const id = tokens.at(2);
            const setting = PgSettings.all.find((s) => s.id === id);
            if (!setting) throw new Error(`Setting not found: ${id}`);

            // TODO: Fix complex values e.g. `connection.endpoint`
            return setting.values
              ? PgCommon.callIfNeeded(setting.values).map((v) => `${v}`)
              : ["true", "false"];
          },
        },
      ]),
      handle: (input) => {
        const val = input.args.value;
        const parsedVal = PgCommon.isBoolean(val) ? val === "true" : val;
        PgSettings.set(input.args.id, parsedVal);
      },
    }),
  ],
});
