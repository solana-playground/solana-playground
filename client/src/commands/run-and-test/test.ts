import { FileEntry, PgExplorer } from "../../utils";
import { createCmd } from "../create";
import {
  checkInstallation,
  checkUntrusted,
  createCommonArgs,
  processCommon,
} from "./common";

export const test = createCmd({
  name: "test",
  description: "Run test(s)",
  preChecks: [checkUntrusted, checkInstallation],
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
  it("Fetches my balance", async () => {
    console.log("My address:", pg.wallet.publicKey.toString());
    const balance = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(\`My balance: \${balance} lamports\`);
  });
});
`,
];
