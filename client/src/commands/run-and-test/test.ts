import { FileEntry, PgExplorer } from "../../utils";
import { createCmd } from "../create";
import { createCommonArgs, processCommon } from "./common";

export const test = createCmd({
  name: "test",
  description: "Run test(s)",
  args: createCommonArgs(PgExplorer.PATHS.TESTS_DIRNAME),
  handle: (input) => {
    return processCommon({
      paths: input.args.paths,
      isTest: true,
      folderPath: PgExplorer.PATHS.TESTS_DIRNAME,
      // TODO: Make it template-based
      defaultFile: DEFAULT_FILE,
    });
  },
});

/** The default test file */
const DEFAULT_FILE: FileEntry = [
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
