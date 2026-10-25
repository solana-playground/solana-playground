import { createCmd } from "../create";

/**
 * This is a port of [solana-program/program-metadata].
 *
 * [solana-program/program-metadata]: https://github.com/solana-program/program-metadata/tree/04af43b44e4c11e664000d82cd22b53b37640c03/clients/js/src/cli
 */
export const programMetadata = createCmd({
  name: "program-metadata",
  description: "CLI to manage Solana program metadata and IDLs",
  proxy: true,
  handle: async (input) => {
    const { run } = await import("./cli");
    const overrides = await import("./overrides");
    // @ts-expect-error
    await run(input.tokens, overrides);
  },
});
