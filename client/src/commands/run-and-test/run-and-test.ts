import {
  PgClientImporter,
  PgCommon,
  PgExplorer,
  PgTerminal,
} from "../../utils/pg";
import { createCmd } from "../create";

export const run = createCmd({
  name: "run",
  description: "Run script(s)",
  run: (input) => processCommon({ input, isTest: false }),
});

export const test = createCmd({
  name: "test",
  description: "Run test(s)",
  run: (input) => processCommon({ input, isTest: true }),
});

/**
 * Process `run` or `test` command.
 *
 * @param param -
 * - `input`: Command input(full)
 * - `isTest`: Whether to execute as test
 */
const processCommon = async ({
  input,
  isTest,
}: {
  input: string;
  isTest: boolean;
}) => {
  PgTerminal.log(PgTerminal.info(`Running ${isTest ? "tests" : "client"}...`));

  const path = /^\w+\s?(.*)/.exec(input)?.at(1);
  const { PgClient } = await PgClientImporter.import();

  // Run the script only at the given path
  if (path) {
    const code = PgExplorer.getFileContent(path);
    if (!code) throw new Error(`File '${path}' doesn't exist`);

    const fileName = PgExplorer.getItemNameFromPath(path);
    if (!PgExplorer.isFileJsLike(fileName)) {
      throw new Error(`File '${fileName}' is not a script file`);
    }

    return await PgClient.execute({ fileName, code, isTest });
  }

  const folderPath = isTest
    ? PgExplorer.PATHS.TESTS_DIRNAME
    : PgExplorer.PATHS.CLIENT_DIRNAME;
  const folder = PgExplorer.getFolderContent(folderPath);

  // Create default client/test if the folder is empty
  if (!folder.files.length && !folder.folders.length) {
    let DEFAULT;
    if (isTest) {
      PgTerminal.log(PgTerminal.info("Creating default test..."));
      DEFAULT = DEFAULT_TEST;
    } else {
      PgTerminal.log(PgTerminal.info("Creating default client..."));
      DEFAULT = DEFAULT_CLIENT;
    }

    const [fileName, code] = DEFAULT;
    await PgExplorer.newItem(PgCommon.joinPaths(folderPath, fileName), code);

    return await PgClient.execute({ fileName, code, isTest });
  }

  // Run all files inside the folder
  for (const fileName of folder.files.filter(PgExplorer.isFileJsLike)) {
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
