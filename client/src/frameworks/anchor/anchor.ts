import { PgFramework } from "../../utils";
import { createFramework, getIsCurrentCommon } from "../create";

export const anchor = createFramework({
  name: "Anchor",
  description:
    "Anchor is a framework providing several convenient developer tools for writing Solana programs.",
  language: "Rust",
  docs: {
    url: "https://www.anchor-lang.com/docs/quickstart/solpg",
  },
  githubExample: {
    name: "Realloc",
    // TODO: Also include tests
    url: "https://github.com/solana-foundation/program-examples/tree/6d134a7a978dfe1c96b2b0e9602e029d0226596c/basics/realloc/anchor/programs/anchor-realloc",
  },
  // The `version` field is intentionally omitted; `anchor-0.29.0` has a
  // dedicated template
  legacy: {},
  getIsCurrent: (files) => {
    // Return `false` if it's a Seahorse project otherwise this will return a
    // false positive because every Seahorse workspace is a valid Anchor one.
    //
    // TODO: Handle this check from Seahorse side. Ideally we wouldn't need to
    // include Seahorse related checks in any of the Anchor files.
    const isSeahorse: boolean = PgFramework.get("Seahorse").getIsCurrent(files);
    if (isSeahorse) return false;
    return getIsCurrentCommon(files, "lib.rs", ["anchor_lang", "#[program]"]);
  },
});
