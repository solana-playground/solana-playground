import { createCmd, PgClientImporter } from "../../utils/pg";

export const test = createCmd({
  name: "test",
  description: "Run test(s)",
  run: async (input) => {
    const match = new RegExp(/^\w+\s?(.*)/).exec(input);
    if (!match) return;

    const { PgClient } = await PgClientImporter.import();
    await PgClient.run({ path: match[1], isTest: true });
  },
});
