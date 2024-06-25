import {
  PgCommon,
  PgConnection,
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
  const PROGRAM_PATH = "program";

  const frameworkFiles: TupleFiles = [];
  for (let [path, content] of files) {
    // src -> program/src
    if (path.startsWith(PgExplorer.PATHS.SRC_DIRNAME)) {
      path = PgCommon.joinPaths(PROGRAM_PATH, path);
    }

    // client -> client
    else if (path.startsWith(PgExplorer.PATHS.CLIENT_DIRNAME)) {
      content = convertJS(content);
    }

    // tests/**/*.test.ts -> tests/**/*.test.ts
    else if (path.startsWith(PgExplorer.PATHS.TESTS_DIRNAME)) {
      content = convertJS(content);
    }

    // Don't include other files
    else continue;

    frameworkFiles.push([path, content]);
  }

  // Add the files that don't exist in Playground
  frameworkFiles.push(
    // Program Cargo.toml
    [
      PgCommon.joinPaths(PROGRAM_PATH, "Cargo.toml"),
      `[package]
name = "${PgCommon.toKebabFromTitle(
        PgExplorer.currentWorkspaceName ?? "solpg"
      )}"
version = "0.1.0"
description = "Native Solana Program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[features]
no-entrypoint = []

${await getRustDependencies(files)}
`,
    ],

    // .gitignore
    [
      ".gitignore",
      `.DS_Store
target
node_modules
test-ledger
`,
    ],

    // .prettierignore
    [
      ".prettierignore",
      `.DS_Store
target
test-ledger
`,
    ],

    // package.json
    [
      "package.json",
      `{
  "scripts": {
    "lint:fix": "prettier */*.js \\"*/**/*{.js,.ts}\\" -w",
    "lint": "prettier */*.js \\"*/**/*{.js,.ts}\\" --check",
    "client": "yarn run ts-node client/*.ts",
    "test": "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
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

  return frameworkFiles;
};

/**
 * Try to make the JS/TS file work in a local `node` environment by making the
 * necessary conversions.
 *
 * @param content JS/TS code
 * @returns the converted content
 */
const convertJS = (content: string) => {
  // Handle imports
  content = addImports(content);

  // Define Playground globals
  content = addAfter(
    content,
    IMPORT_STATEMENT_REGEX,
    `// Manually initialize variables that are automatically defined in Playground
const PROGRAM_ID = new web3.PublicKey(${
      PgProgramInfo.pk ? `"${PgProgramInfo.pk.toBase58()}"` : "/* Program id */"
    });
const connection = new web3.Connection("${
      PgConnection.current.rpcEndpoint
    }", "${PgConnection.current.commitment}");
const wallet = { keypair: web3.Keypair.generate() };
`
  );

  // Handle pg namespace
  content = content
    .replaceAll("pg.PROGRAM_ID", "PROGRAM_ID")
    .replaceAll("pg.connection", "connection")
    .replaceAll("pg.wallet.keypair", "wallet.keypair")
    .replaceAll("pg.wallet.publicKey", "wallet.keypair.publicKey");

  return content;
};
