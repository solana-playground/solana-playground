import {
  PgClientImporter,
  PgCommon,
  PgExplorer,
  PgLanguage,
  PgTerminal,
} from "../../utils/pg";
import { createArgs, createCmd } from "../create";

/**
 * Crate common arguments.
 *
 * @param parentPath path that is expected to be run inside of
 * @returns the common arguments
 */
const createCommonArgs = (parentPath: string) =>
  createArgs([
    {
      name: "paths",
      optional: true,
      multiple: true,
      values: (token) => {
        if (token.startsWith(PgExplorer.PATHS.ROOT_DIR_PATH)) {
          const path = token.endsWith("/")
            ? token
            : PgExplorer.getParentPathFromPath(token);
          const folder = PgExplorer.getFolderContent(path);
          return [
            ...folder.files
              .map((name) => PgCommon.joinPaths(path, name))
              .filter(PgLanguage.getIsPathJsLike),
            ...folder.folders
              .map((name) => PgCommon.joinPaths(path, name))
              .map(PgCommon.appendSlash),
          ];
        }

        return PgExplorer.getAllFiles()
          .map(([path]) => path)
          .filter(PgLanguage.getIsPathJsLike)
          .map(PgExplorer.getRelativePath)
          .filter((path) => path.startsWith(parentPath))
          .map((path) => path.replace(PgCommon.appendSlash(parentPath), ""));
      },
    },
  ]);

export const run = createCmd({
  name: "run",
  description: "Run script(s)",
  args: createCommonArgs(PgExplorer.PATHS.CLIENT_DIRNAME),
  handle: (input) => processCommon({ paths: input.args.paths, isTest: false }),
});

export const test = createCmd({
  name: "test",
  description: "Run test(s)",
  args: createCommonArgs(PgExplorer.PATHS.TESTS_DIRNAME),
  handle: (input) => processCommon({ paths: input.args.paths, isTest: true }),
});

/**
 * Process `run` or `test` command.
 *
 * @param params -
 * - `paths`: File paths to run or test
 * - `isTest`: Whether to execute as test
 */
const processCommon = async (params: {
  paths: string[] | undefined;
  isTest: boolean;
}) => {
  const { paths, isTest } = params;
  PgTerminal.println(
    PgTerminal.info(`Running ${isTest ? "tests" : "client"}...`)
  );

  const { PgClient } = await PgClientImporter.import();

  const folderPath = isTest
    ? PgExplorer.PATHS.TESTS_DIRNAME
    : PgExplorer.PATHS.CLIENT_DIRNAME;

  // Run the script only at the given path
  if (paths?.length) {
    // The path can be a file name that's expected to run inside the `client`
    // or `tests` directory based on the command that's running
    for (const path of paths) {
      const code =
        PgExplorer.getFileContent(path) ??
        PgExplorer.getFileContent(PgCommon.joinPaths(folderPath, path));
      if (!code) throw new Error(`File '${path}' doesn't exist`);

      const fileName = PgExplorer.getItemNameFromPath(path);
      if (!PgLanguage.getIsPathJsLike(fileName)) {
        throw new Error(`File '${fileName}' is not a script file`);
      }

      await PgClient.execute({ fileName, code, isTest });
    }

    return;
  }

  // Create default client/test if the folder is empty
  const folder = PgExplorer.getFolderContent(folderPath);
  if (!folder.files.length && !folder.folders.length) {
    let DEFAULT;
    if (isTest) {
      PgTerminal.println(PgTerminal.info("Creating default test..."));
      DEFAULT = DEFAULT_TEST;
    } else {
      PgTerminal.println(PgTerminal.info("Creating default client..."));
      DEFAULT = DEFAULT_CLIENT;
    }

    const [fileName, code] = DEFAULT;
    await PgExplorer.createItem(PgCommon.joinPaths(folderPath, fileName), code);
    return await PgClient.execute({ fileName, code, isTest });
  }

  // Run all files inside the folder
  for (const fileName of folder.files.filter(PgLanguage.getIsPathJsLike)) {
    const code = PgExplorer.getFileContent(
      PgCommon.joinPaths(folderPath, fileName)
    )!;
    await PgClient.execute({ fileName, code, isTest });
  }
};

/** Default client files*/
const DEFAULT_CLIENT = [
  "client.ts",
  `// Client
console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(\`My balance: \${balance / web3.LAMPORTS_PER_SOL} SOL\`);
`,
];

/** Default test files */
const DEFAULT_TEST = [
  "index.test.ts",
  `describe("Test", () => {
  it("Airdrop", async () => {
    // Fetch my balance
    const balance = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(\`My balance is \${balance} lamports\`);

    // Airdrop 1 SOL
    const airdropAmount = 1 * web3.LAMPORTS_PER_SOL;
    const txHash = await pg.connection.requestAirdrop(
      pg.wallet.publicKey,
      airdropAmount
    );

    // Confirm transaction
    await pg.connection.confirmTransaction(txHash);

    // Fetch new balance
    const newBalance = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(\`New balance is \${newBalance} lamports\`);

    // Assert balances
    assert(balance + airdropAmount === newBalance);
  });
});
`,
];
