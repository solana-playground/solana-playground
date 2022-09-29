import { ScriptTarget, transpile } from "typescript";
import { Buffer } from "buffer";
import * as assert from "assert";
import * as mocha from "mocha";
import * as util from "util";
import * as borsh from "borsh";
import * as web3 from "@solana/web3.js";
import * as BufferLayout from "@solana/buffer-layout";
import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import { PgTest } from "../test";
import { PgTerminal } from "../terminal";
import { PgProgramInfo } from "../program-info";
import { PgWallet } from "../wallet";
import { PgCommon } from "../common";

/**
 * Utilities to be available under the `pg` namespace
 */
interface Pg {
  connection: web3.Connection;
  wallet?: PgWallet | AnchorWallet;
  PROGRAM_ID?: web3.PublicKey;
  program?: anchor.Program;
}

export class PgClient {
  private _isClientRunning: boolean;
  private _IframeWindow?: Window;

  constructor() {
    this._isClientRunning = false;
  }

  /**
   * Run or test js/ts code
   *
   * @param code Client code to run/test
   * @param wallet Playground or Anchor Wallet
   * @param connection Current connection
   * @param opts
   * - isTest: whether to run the code as test
   *
   * @returns A promise that will resolve once all tests are finished
   */
  async run(
    code: string,
    fileName: string,
    wallet: PgWallet | AnchorWallet | null,
    connection: web3.Connection,
    opts?: { isTest?: boolean }
  ): Promise<void> {
    const isTest = opts?.isTest;
    await this._run(async (iframeWindow) => {
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
      } else {
        this._isClientRunning = true;
      }

      PgTerminal.logWasm(`  ${fileName}:`);

      // Add globally accessed objects
      const globals: [string, object][] = [
        /// Modules
        ["assert", assert],
        ["Buffer", Buffer],
        ["borsh", borsh],
        ["BufferLayout", BufferLayout],
        ["web3", web3],
        ["anchor", anchor],
        ["BN", anchor.BN],

        /// Functions
        ["sleep", PgCommon.sleep],

        /// Classes
        ["Keypair", web3.Keypair],
        ["PublicKey", web3.PublicKey],
        ["Connection", web3.Connection],
      ];
      const pg: Pg = { connection };

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
        globals.push(["_finish", () => (this._isClientRunning = false)]);

        endCode = "_finish()";
      }

      // Playground inherited
      if (wallet) {
        pg.wallet = wallet;

        // Anchor IDL
        const idl = PgProgramInfo.getProgramInfo().idl;
        if (idl) {
          pg.program = PgTest.getProgram(idl, connection, wallet);
        }
      }
      const PROGRAM_ID = PgProgramInfo.getPk().programPk;
      if (PROGRAM_ID) {
        pg.PROGRAM_ID = PROGRAM_ID;
      }

      // Set Playground inherited object
      globals.push(["pg", pg]);

      // Setup iframe globals
      for (const args of globals) {
        // @ts-ignore
        iframeWindow[args[0]] = args[1];
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
          const intervalId = setInterval(() => {
            if (!this._isClientRunning) {
              PgTerminal.logWasm("");
              clearInterval(intervalId);
              res();
            }
          }, 1000);
        }
      });
    }, !!isTest);
  }

  readonly DEFAULT_CLIENT = [
    "client.ts",
    `// Client
console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(\`My balance: \${balance / web3.LAMPORTS_PER_SOL} SOL\`);
`,
  ];

  readonly DEFAULT_TEST = [
    "index.test.ts",
    `describe("Test", () => {
  it("Airdrop", async () => {
    // Fetch my balance
    const balance = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(\`My balance is \${balance} lamports\`);

    // Airdrop 1 SOL
    const airdropAmount = 1 * web3.LAMPORTS_PER_SOL;
    const txHash = await pg.connection.requestAirdrop(pg.wallet.publicKey, airdropAmount);

    // Confirm transaction
    await pg.connection.confirmTransaction(txHash);

    // Fetch new balance
    const newBalance = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(\`New balance is \${newBalance} lamports\`);

    // Assert balances
    assert(balance + airdropAmount === newBalance);
  })
})
`,
  ];

  /**
   * Wrapper function to control client running state
   *
   * @param cb callback function to run
   * @param isTest whether running tests and not client
   */
  private async _run(
    cb: (iframeWindow: Window) => Promise<void>,
    isTest: boolean
  ) {
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
          PgTerminal.logWasm(padding + util.format(msg, ...rest));
        },
        error: (msg: string, ...rest: any[]) => {
          PgTerminal.logWasm(
            padding + PgTerminal.error(util.format(msg, ...rest))
          );
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
  private _getIframeWindow() {
    if (this._IframeWindow) return this._IframeWindow;

    const iframeEls = document.getElementsByTagName("iframe");
    if (!iframeEls.length) throw new Error("No iframe element");
    const iframeWindow = (iframeEls[0] as HTMLIFrameElement).contentWindow;
    if (!iframeWindow) throw new Error("No iframe window");

    const handleIframeError = (e: ErrorEvent) => {
      PgTerminal.logWasm(`    ${e.message}`);
      this._isClientRunning = false;
    };

    iframeWindow.addEventListener("error", handleIframeError);

    this._IframeWindow = iframeWindow;

    return this._IframeWindow;
  }
}

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
