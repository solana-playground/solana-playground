import { FileEntry, PgExplorer } from "../../utils";
import { createCmd } from "../create";
import { checkUntrusted, createCommonArgs, processCommon } from "./common";

export const run = createCmd({
  name: "run",
  description: "Run script(s)",
  preChecks: checkUntrusted,
  args: createCommonArgs(PgExplorer.PATHS.CLIENT_DIRNAME),
  handle: (input) => {
    return processCommon({
      paths: input.args.paths,
      isTest: false,
      folderPath: PgExplorer.PATHS.CLIENT_DIRNAME,
      // TODO: Make it template-based
      defaultFile: DEFAULT_FILE,
    });
  },
});

/** The default client file */
const DEFAULT_FILE: FileEntry = [
  "client.ts",
  `// Client
console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(\`My balance: \${balance / web3.LAMPORTS_PER_SOL} SOL\`);
`,
];
