import { createCmd } from "../create-command";
import { PgClientImporter } from "../../client";

export const run = createCmd({
  name: "run",
  description: "Run script(s)",
  run: async (input) => {
    const match = new RegExp(/^\w+\s?(.*)/).exec(input);
    if (!match) return;

    const { PgClient } = await PgClientImporter.import();
    await PgClient.run({ path: match[1], isTest: false });
  },
});
