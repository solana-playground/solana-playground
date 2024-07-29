import {
  PgCommon,
  PgExplorer,
  PgProgramInfo,
  TupleFiles,
} from "../../utils/pg";
import {
  addAfter,
  addImports,
  getJSDependencies,
  getRustDependencies,
  IMPORT_STATEMENT_REGEX,
} from "../common";

/**
 * {@link Framework.importFromPlayground}
 */
export const convertFromPlayground = async (files: TupleFiles) => {
  // Program manifest's lib name must match the `#[program]` module name and
  // Anchor.toml programs definition
  const libContent = files.find(([path]) => path.endsWith("lib.rs"))?.[1];
  if (!libContent) throw new Error("lib.rs not found");

  const programName =
    /(pub\s+)?mod\s+(\w+)/m.exec(libContent)?.[2] ??
    PgCommon.toSnakeCase(PgExplorer.currentWorkspaceName ?? "program");
  const packageName = PgCommon.toKebabFromSnake(programName);
  const programPath = PgCommon.joinPaths("programs", packageName);

  const frameworkFiles: TupleFiles = [];
  for (let [path, content] of files) {
    // src -> programs/<program-name>/src
    if (path.startsWith(PgExplorer.PATHS.SRC_DIRNAME)) {
      path = PgCommon.joinPaths(programPath, path);
    }

    // client -> client
    else if (path.startsWith(PgExplorer.PATHS.CLIENT_DIRNAME)) {
      content = convertJS(content, programName);
    }

    // tests/**/*.test.ts -> tests/**/*.ts
    else if (path.startsWith(PgExplorer.PATHS.TESTS_DIRNAME)) {
      path = path.replace(".test.ts", ".ts");
      content = convertJS(content, programName, { isTest: true });
    }

    // Don't include other files
    else continue;

    frameworkFiles.push([path, content]);
  }

  // Add the files that don't exist in Playground
  frameworkFiles.push(
    // App
    ["app", ""],

    // Migrations
    [
      PgCommon.joinPaths("migrations", "deploy.ts"),
      `// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.
};
`,
    ],

    // Program Cargo.toml
    [
      PgCommon.joinPaths(programPath, "Cargo.toml"),
      `[package]
name = "${packageName}"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${programName}"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

${await getRustDependencies(frameworkFiles)}
`,
    ],

    // Program Xargo.toml
    [
      PgCommon.joinPaths(programPath, "Xargo.toml"),
      `[target.bpfel-unknown-unknown.dependencies.std]
features = []
`,
    ],

    // .gitignore
    [
      ".gitignore",
      `.anchor
.DS_Store
target
**/*.rs.bk
node_modules
test-ledger
.yarn
`,
    ],

    // .prettierignore
    [
      ".prettierignore",
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
      "Anchor.toml",
      `[features]
seeds = false
skip-lint = false

${
  PgProgramInfo.pk
    ? `[programs.localnet]
${programName} = "${PgProgramInfo.pk.toBase58()}"`
    : ""
}

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
client = "yarn run ts-node client/*.ts"
`,
    ],

    // Workspace Cargo.toml
    [
      "Cargo.toml",
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
      "package.json",
      `{
  "scripts": {
    "lint:fix": "prettier */*.js \\"*/**/*{.js,.ts}\\" -w",
    "lint": "prettier */*.js \\"*/**/*{.js,.ts}\\" --check"
  },
${await getJSDependencies(frameworkFiles)}
}
`,
    ],

    // tsconfig.json
    [
      "tsconfig.json",
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
    ]
  );

  // Create program keypair if it exists
  if (PgProgramInfo.kp) {
    frameworkFiles.push([
      PgCommon.joinPaths("target", "deploy", `${programName}-keypair.json`),
      JSON.stringify(Array.from(PgProgramInfo.kp.secretKey)),
    ]);
  }

  return frameworkFiles;
};

/**
 * Try to make the JS/TS file work in a local `node` environment by making the
 * necessary conversions.
 *
 * @param content JS/TS code
 * @param programName  snake case program name
 * @param opts options
 * - `isTest`: whether the given file is a test file
 * @returns the converted content
 */
const convertJS = (
  content: string,
  programName: string,
  opts?: { isTest?: boolean }
) => {
  // Handle imports
  content = addImports(content);
  if (!content.includes("anchor")) {
    content = `import * as anchor from "@coral-xyz/anchor";\n` + content;
  }

  // Add program
  const pascalCaseProgramName = PgCommon.toPascalFromSnake(programName);
  content = addAfter(
    content,
    IMPORT_STATEMENT_REGEX,
    `import type { ${pascalCaseProgramName} } from "../target/types/${programName}";`
  );

  content = opts?.isTest
    ? addAfter(
        content,
        /describe\(.*/,
        `  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());\n
  const program = anchor.workspace.${pascalCaseProgramName} as anchor.Program<${pascalCaseProgramName}>;
  `,
        { firstOccurance: true }
      )
    : addAfter(
        content,
        IMPORT_STATEMENT_REGEX,
        `\n// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());\n
const program = anchor.workspace.${pascalCaseProgramName} as anchor.Program<${pascalCaseProgramName}>;
`
      );

  // Handle pg namespace
  content = content
    .replaceAll("pg.program", "program")
    .replaceAll("pg.PROGRAM_ID", "program.programId")
    .replaceAll("pg.connection", "program.provider.connection")
    .replaceAll("pg.wallet.publicKey", "program.provider.publicKey")
    .replaceAll("pg.wallet.keypair", "program.provider.wallet.payer");

  return content;
};
