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
    name: "Create Account",
    url: "https://github.com/solana-developers/program-examples/tree/main/basics/create-account/anchor",
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
