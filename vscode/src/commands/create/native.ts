import * as _ from "lodash";
import * as path from "path";

import { PATHS } from "../../constants";
import {
  CARGO_TOML_DEPENDENCIES_INFO,
  getProjectName,
  processCreate,
} from "./common";

const SOLANA_VERSION = "1.13.4";

export const processCreateNative = async () => {
  // Get the name of the project
  const name = await getProjectName();

  await processCreate({
    name,
    files: [
      // Program Cargo.toml
      [
        path.join(PATHS.DIRS.PROGRAM, PATHS.FILES.CARGO_TOML),
        `[package]
name = "${name}"
version = "0.1.0"
description = "Native Solana Program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${_.snakeCase(name)}"

[features]
no-entrypoint = []

${CARGO_TOML_DEPENDENCIES_INFO}
[dependencies]
solana-program = "${SOLANA_VERSION}"
`,
      ],

      // Program lib.rs
      [
        path.join(PATHS.DIRS.PROGRAM, PATHS.DIRS.SRC, PATHS.FILES.LIB_RS),
        `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    // Log a message to the blockchain
    msg!("Hello, world!");

    // Gracefully exit the program
    Ok(())
}
`,
      ],

      // .gitignore
      [
        path.join(PATHS.DIRS.PROGRAM, PATHS.FILES.GITIGNORE),
        `.DS_Store
target
**/*.rs.bk
test-ledger
`,
      ],
    ],
  });
};
