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
            const id = getSettingIdFromTokens(tokens);
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
            const id = getSettingIdFromTokens(tokens);
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

/**
 * Get setting ID from the given tokens.
 *
 * This makes strong assumptions about the location of the setting ID argument
 * (index 2), which works fine for now, but would break in the case of nested
 * subcommands.
 *
 * **NOTE:** A better way to handle this situation would be to provide parsed
 * tokens rather than raw tokens to `arg.values` and `arg.parse`. However, this
 * is not straight-forward to achieve because `arg.values` is also used in the
 * autocompletion logic, which currently only concerns itself with the current
 * token without keeping track of the previous ones. Technically, we could do
 * this for `arg.parse`, since that's only used by the command processor, but
 * we're choosing to not do that in order to keep the APIs (arguments) the same.
 *
 * @param tokens command tokens
 * @returns the setting ID without checking whether it's a valid ID
 */
// TODO: Provide parsed tokens instead of raw ones to `arg.values` and `arg.parse`
const getSettingIdFromTokens = (tokens: string[]) => {
  const id = tokens.filter((t) => !t.startsWith("-")).at(2);
  if (!id) throw new Error("Setting ID not found in tokens");
  return id;
};
