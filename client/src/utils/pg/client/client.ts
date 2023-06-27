import { ScriptTarget, transpile } from "typescript";
import { Buffer } from "buffer";
import * as assert from "assert";
import * as borsh from "borsh";
import * as mocha from "mocha";
import * as util from "util";
import * as anchor from "@project-serum/anchor";
import * as BufferLayout from "@solana/buffer-layout";
import * as web3 from "@solana/web3.js";

import { PgClientPackage } from "./package";
import { PgCommon } from "../common";
import { PgConnection } from "../connection";
import { PgExplorer } from "../explorer";
import { PgProgramInfo } from "../program-info";
import { PgTerminal } from "../terminal";
import { PgTest } from "../test";
import { CurrentWallet, PgWallet, StandardWallet } from "../wallet";

/** Utilities to be available under the `pg` namespace */
interface Pg {
  /** Playground connection instance */
  connection: web3.Connection;
  /** Current connected wallet */
  wallet?: CurrentWallet;
  /** All available wallets, including the standard wallets */
  wallets?: Record<string, CurrentWallet | StandardWallet>;
  /** Current project's program public key */
  PROGRAM_ID?: web3.PublicKey;
  /** Anchor program instance of the current project */
  program?: anchor.Program;
}

/** Options to use when running a script/test */
export interface ClientOptions {
  /** Path to the script/test file */
  path?: string | null;
  /** Whether to run the script as a test */
  isTest?: boolean;
}

export class PgClient {
  /**
   * Run or test js/ts code
   *
   * @param opts -
   * - path: path to execute
   * - isTest: whether to run the code as test
   *
   * @returns A promise that will resolve once all tests are finished
   */
  static async run({ path, isTest }: ClientOptions) {
    // Block creating multiple client/test instances at the same time
    if (this._isClientRunning) {
      if (isTest) {
        throw new Error("Please wait for client to finish.");
      }

      throw new Error("Client is already running!");
    }
    // @ts-ignore
    if (mocha._state === "running") {
      if (!isTest) {
        throw new Error("Please wait for tests to finish.");
      }

      throw new Error("Tests are already running!");
    }

    PgTerminal.log(
      PgTerminal.info(`Running ${isTest ? "tests" : "client"}...`)
    );

    // Run only the given path
    if (path) {
      const code = PgExplorer.getFileContent(path);
      if (!code) return;
      const fileName = PgExplorer.getItemNameFromPath(path);
      await this._runFile(fileName, code, { isTest });

      return;
    }

    const folderPath = PgExplorer.appendToCurrentWorkspacePath(
      isTest ? PgExplorer.PATHS.TESTS_DIRNAME : PgExplorer.PATHS.CLIENT_DIRNAME
    );
    const folder = PgExplorer.getFolderContent(folderPath);
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
      await PgExplorer.newItem(
        PgCommon.joinPaths([folderPath, fileName]),
        code
      );
      await this._runFile(fileName, code, {
        isTest,
      });

      return;
    }

    // Run all files inside the folder
    for (const fileName of folder.files) {
      const code = PgExplorer.getFileContent(
        PgCommon.joinPaths([folderPath, fileName])
      );
      if (!code) continue;

      await this._runFile(fileName, code, {
        isTest,
      });
    }
  }

  /**
   * Execute the given script/test as a single file
   *
   * @param fileName name of the file to run
   * @param code code to execute
   * @param opts run options
   */
  private static async _runFile(
    fileName: string,
    code: string,
    { isTest }: ClientOptions
  ) {
    await this._run(async (iframeWindow) => {
      PgTerminal.log(`  ${fileName}:`);

      for (const keyword of BLACKLISTED_KEYWORDS) {
        if (code.includes(keyword)) {
          throw new Error(`'${keyword}' is not allowed`);
        }
      }

      if (isTest) {
        if (!code.includes("describe")) {
          throw new Error(
            `Tests must use '${PgTerminal.bold(
              "describe"
            )}' function. Use '${PgTerminal.bold(
              "run"
            )}' command to run the script.`
          );
        }
      }

      // Add globally accessed objects
      const globals: [string, object][] = [
        /// Modules
        ["anchor", anchor],
        ["assert", assert],
        ["BN", anchor.BN],
        ["borsh", borsh],
        ["Buffer", Buffer],
        ["BufferLayout", BufferLayout],
        ["web3", web3],

        // https://github.com/solana-playground/solana-playground/issues/82
        ["Uint8Array", Uint8Array],

        /// Functions
        ["sleep", PgCommon.sleep],
      ];

      // Handle imports
      const importResult = await PgClient._handleImports(code);
      code = importResult.code;
      globals.push(...importResult.imports);

      let endCode;
      if (isTest) {
        // Setup mocha
        try {
          if (describe !== undefined) {
            // Reset suite
            // @ts-ignore
            mocha.suite.suites = [];
            // @ts-ignore
            mocha.suite.tests = [];
          }
        } catch {}

        // @ts-ignore
        mocha.setup({
          ui: "bdd",
          timeout: "30000",
          // Mocha disposes itself after the `run` function without this option
          cleanReferencesAfterRun: false,
          // Logs the test output to the browser console
          reporter: "spec",
        });

        // Set mocha globals
        globals.push(
          ["after", after],
          ["afterEach", afterEach],
          ["before", before],
          ["beforeEach", beforeEach],
          ["context", context],
          ["describe", describe],
          ["it", it],
          ["specify", specify],
          ["xcontext", xcontext],
          ["xdescribe", xdescribe],
          ["xit", xit],
          ["xspecify", xspecify],
          ["_run", mocha.run]
        );

        endCode = "_run()";
      } else {
        // Run only
        globals.push([
          "_end",
          () =>
            PgCommon.createAndDispatchCustomEvent(CLIENT_ON_DID_FINISH_RUNNING),
        ]);

        endCode = "_end()";
      }

      // Playground utils namespace
      const pg: Pg = { connection: PgConnection.current };

      // Wallet
      if (PgWallet.current) pg.wallet = PgWallet.current;

      // Wallets
      if (pg.wallet) {
        pg.wallets = {};

        const pgWallets = PgWallet.accounts.map(PgWallet.createWallet);
        const standardWallets = PgWallet.getConnectedStandardWallets();

        const wallets = [...pgWallets, ...standardWallets];
        for (const wallet of wallets) {
          pg.wallets[PgCommon.toCamelCase(wallet.name)] = wallet;
        }
      }

      // Program ID
      if (PgProgramInfo.pk) pg.PROGRAM_ID = PgProgramInfo.pk;

      // Anchor Program
      if (pg.wallet && PgProgramInfo.idl) {
        pg.program = PgTest.getProgram(
          PgProgramInfo.idl,
          pg.connection,
          pg.wallet
        );
      }

      // Set playground inherited object
      globals.push(["pg", pg]);

      // Setup iframe globals
      for (const [name, pkg] of globals) {
        // @ts-ignore
        iframeWindow[name] = pkg;
      }

      // Create script element in the iframe
      const iframeDocument = iframeWindow.document;
      const scriptEls = iframeDocument.getElementsByTagName("script");
      if (scriptEls.length) {
        iframeDocument.head.removeChild(scriptEls[0]);
      }
      const scriptEl = document.createElement("script");
      iframeDocument.head.appendChild(scriptEl);

      for (const keyword of UNDEFINED_KEYWORDS) {
        code = `${keyword} = undefined;` + code;
      }

      // This approach:
      // 1- Wraps the code in a class to block window access from `this`
      // 2- Allows top-level async
      // 3- Helps detecting when tests finish
      code = `(async () => {
  class __Pg { async __run() {\n${code}\n} }
  const __pg = new __Pg();
  try { await __pg.__run(); }
  catch (e) { console.log("Uncaught error:", e.message) }
  finally { ${endCode} }
}()`;

      // Transpile and inject the script to the iframe element
      scriptEl.textContent = transpile(code, {
        target: ScriptTarget.ES5,
        removeComments: true,
      });

      return new Promise((res) => {
        if (isTest) {
          const intervalId = setInterval(() => {
            // @ts-ignore
            if (mocha._state === "init") {
              clearInterval(intervalId);
              res();
            }
          }, 1000);
        } else {
          const { dispose } = PgCommon.onDidChange({
            cb: () => {
              PgTerminal.log("");
              dispose();
              res();
            },
            eventName: CLIENT_ON_DID_FINISH_RUNNING,
          });
        }
      });
    }, isTest);
  }

  /**
   * Wrapper function to control client running state
   *
   * @param cb callback function to run
   * @param isTest whether to execute as a test
   */
  private static async _run(
    cb: (iframeWindow: Window) => Promise<void>,
    isTest: ClientOptions["isTest"]
  ) {
    if (!isTest) this._isClientRunning = true;

    try {
      const iframeWindow = this._getIframeWindow();

      // Remove everything from the iframe window object
      for (const key in iframeWindow) {
        try {
          delete iframeWindow[key];
        } catch {
          // Not every key can be deleted from the window object
        }
      }

      // Redefine console inside the iframe to log in the terminal
      const padding = "    ";
      // @ts-ignore
      iframeWindow["console"] = {
        log: (msg: string, ...rest: any[]) => {
          PgTerminal.log(padding + util.format(msg, ...rest));
        },
        error: (msg: string, ...rest: any[]) => {
          PgTerminal.log(padding + PgTerminal.error(util.format(msg, ...rest)));
        },
      };

      await cb(iframeWindow);
    } catch (e) {
      throw e;
    } finally {
      if (!isTest) this._isClientRunning = false;
    }
  }

  /**
   * Get the window element of the script Iframe
   *
   * @returns Iframe's window element
   */
  private static _getIframeWindow() {
    if (this._IframeWindow) return this._IframeWindow;

    const iframeEl = document.createElement("iframe");
    iframeEl.style.display = "none";
    document.body.appendChild(iframeEl);
    const iframeWindow = iframeEl.contentWindow;
    if (!iframeWindow) throw new Error("No iframe window");

    const handleIframeError = (e: ErrorEvent) => {
      PgTerminal.log(`    ${e.message}`);
      this._isClientRunning = false;
    };

    iframeWindow.addEventListener("error", handleIframeError);

    this._IframeWindow = iframeWindow;

    return this._IframeWindow;
  }

  /**
   * Handle user specified imports
   *
   * @param code script/test code
   * @returns the code without import statements and the imported packages
   */
  private static async _handleImports(code: string) {
    const importRegex = new RegExp(
      /import\s+((\*\s+as\s+(\w+))|({[\s+\w+\s+,]*}))\s+from\s+["|'](.+)["|']/gm
    );
    let importMatch: RegExpExecArray | null;

    const imports: [string, object][] = [];

    const setupImport = (pkg: { [key: string]: any }) => {
      // 'import as *' syntax
      if (importMatch?.[3]) {
        imports.push([importMatch[3], pkg]);
      }
      // 'import {}' syntax
      else if (importMatch?.[4]) {
        const namedImports = importMatch[4]
          .substring(1, importMatch[4].length - 1)
          .replace(/\s+\n?/g, "")
          .split(",");
        for (const namedImport of namedImports) {
          imports.push([namedImport, pkg[namedImport]]);
        }
      }
    };

    do {
      importMatch = importRegex.exec(code);
      if (importMatch) {
        const pkg = await PgClientPackage.import(importMatch[5]);
        setupImport(pkg);
      }
    } while (importMatch);

    // Remove import statements
    // Need to do this after we setup all the imports because of internal
    // cursor index state the regex.exec has.
    code = code.replace(importRegex, "");

    return { code, imports };
  }

  /** Whether a script is currently running */
  private static _isClientRunning: boolean;

  /** Cached `Iframe` `Window` object */
  private static _IframeWindow: Window;
}

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

/** Keywords that are not allowed to be in the user code */
const BLACKLISTED_KEYWORDS = [
  "window",
  "globalThis",
  "document",
  "location",
  "top",
  "chrome",
];

/** Keywords that will be set to `undefined` */
const UNDEFINED_KEYWORDS = ["eval", "Function"];

/** Event name that will be dispatched when client code completes executing */
const CLIENT_ON_DID_FINISH_RUNNING = "clientondidfinishrunning";
