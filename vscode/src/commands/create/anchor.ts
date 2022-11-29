import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as _ from "lodash";

import { PATHS } from "../../constants";
import {
  CARGO_TOML_DEPENDENCIES_INFO,
  getProjectName,
  processCreate,
  processInstallNodeModules,
} from "./common";
import { PgFs, PgWallet } from "../../utils";

const ANCHOR_VERSION = "0.25.0";

export const processCreateAnchor = async () => {
  // Get the name of the project
  const name = await getProjectName();

  // Create default anchor files, mirrored from anchor-cli
  const { createdNewFolder } = await processCreate({
    name,
    files: [
      // App folder
      [PATHS.DIRS.APP, ""],

      // Migrations
      [
        path.join(PATHS.DIRS.MIGRATIONS, PATHS.FILES.DEPLOY_TS),
        `// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

const anchor = require("@project-serum/anchor");

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.
};
`,
      ],

      // Program Cargo.toml
      [
        path.join(PATHS.DIRS.PROGRAMS, name, PATHS.FILES.CARGO_TOML),
        `[package]
name = "${name}"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${_.snakeCase(name)}"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

${CARGO_TOML_DEPENDENCIES_INFO}
[dependencies]
anchor-lang = "${ANCHOR_VERSION}"
`,
      ],

      // Program Xargo.toml
      [
        path.join(PATHS.DIRS.PROGRAMS, name, PATHS.FILES.XARGO_TOML),
        `[target.bpfel-unknown-unknown.dependencies.std]
features = []
`,
      ],

      // Program lib.rs
      [
        path.join(
          PATHS.DIRS.PROGRAMS,
          name,
          PATHS.DIRS.SRC,
          PATHS.FILES.LIB_RS
        ),
        `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod ${_.snakeCase(name)} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
`,
      ],

      // Mocha test
      [
        path.join(PATHS.DIRS.TESTS, `${name}.ts`),
        `const anchor = require("@project-serum/anchor");

describe("${name}", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  it("Is initialized!", async () => {
    // Add your test here.
    const program = anchor.workspace.${_.camelCase(name)};
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
`,
      ],

      // .gitignore
      [
        PATHS.FILES.GITIGNORE,
        `.anchor
.DS_Store
target
**/*.rs.bk
node_modules
test-ledger
`,
      ],

      // .prettierignore
      [
        PATHS.FILES.PRETTIERIGNORE,
        `.anchor
.DS_Store
target
node_modules
dist
build
test-ledger
`,
      ],

      // Anchor.toml
      [
        PATHS.FILES.ANCHOR_TOML,
        `[features]
seeds = false
skip-lint = false
[programs.localnet]
default = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "localnet"
wallet = "${PgWallet.DEFAULT_KEYPAIR_PATH}"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
`,
      ],

      // Workspace Cargo.toml
      [
        PATHS.FILES.CARGO_TOML,
        `[workspace]
members = [
    "programs/*"
]

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
`,
      ],

      // package.json
      [
        PATHS.FILES.PACKAGE_JSON,
        `{
    "scripts": {
        "lint:fix": "prettier */*.js \\"*/**/*{.js,.ts}\\" -w",
        "lint": "prettier */*.js \\"*/**/*{.js,.ts}\\" --check"
    },
    "dependencies": {
        "@project-serum/anchor": "^${ANCHOR_VERSION}"
    },
    "devDependencies": {
        "chai": "^4.3.4",
        "mocha": "^9.0.3",
        "ts-mocha": "^10.0.0",
        "@types/bn.js": "^5.1.0",
        "@types/chai": "^4.3.0",
        "@types/mocha": "^9.0.0",
        "typescript": "^4.3.5",
        "prettier": "^2.6.2"
    }
}
`,
      ],

      // tsconfig.json
      [
        PATHS.FILES.TSCONFIG_JSON,
        `{
  "compilerOptions": {
    "types": ["mocha", "chai"],
    "typeRoots": ["./node_modules/@types"],
    "lib": ["es2015"],
    "module": "commonjs",
    "target": "es6",
    "esModuleInterop": true
  }
}
      `,
      ],
    ],
  });

  await processInstallNodeModules({
    name,
    createdNewFolder,
  });

  const baseUri = await PgFs.getBaseUri();
  const projectUri = createdNewFolder
    ? vscode.Uri.joinPath(baseUri, name)
    : baseUri;

  return { name, projectUri };
};
