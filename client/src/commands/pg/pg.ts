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
        const fields = input.args.id.split(".");
        const value = fields.reduce((acc, cur) => acc[cur], PgSettings as any);
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
            const id = token
              ? tokens[tokens.findIndex((t) => t === token) - 1]
              : tokens[tokens.length - 1];
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
        const fields = input.args.id.split(".");
        const parentObj = fields
          .slice(0, -1)
          .reduce((acc, cur) => acc[cur], PgSettings as any);
        const lastField = fields.at(-1)!;
        const v = input.args.value;
        parentObj[lastField] = PgCommon.isBoolean(v) ? v === "true" : v;
      },
    }),
  ],
});
