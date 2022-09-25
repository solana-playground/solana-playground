import { transpile } from "typescript";
import * as assert from "assert";
import * as mocha from "mocha";
import * as util from "util";
import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import { PgTest } from "../test/test";
import { PgTerminal } from "../terminal";
import { PgProgramInfo } from "../program-info";
import { PgWallet } from "../wallet";
import { PgCommon } from "../common";

export class PgClient {
  private _isClientRunning: boolean;

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

    for (const blacklistedWord of _BLACKLISTED_WORDS) {
      if (code.includes(blacklistedWord)) {
        throw new Error(`'${blacklistedWord}' is not allowed`);
      }
    }

    if (!isTest) {
      this._isClientRunning = true;
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

    PgTerminal.logWasm(`  ${fileName}:`);

    const iframeEls = document.getElementsByTagName("iframe");
    if (!iframeEls.length) throw new Error("No iframe element");
    const iframeWindow = (iframeEls[0] as HTMLIFrameElement).contentWindow;
    if (!iframeWindow) throw new Error("No iframe window");

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

    // Add globally accessed objects
    const globals: [string, object][] = [
      /// Modules
      ["assert", assert],
      ["web3", web3],
      ["anchor", anchor],
      ["BN", anchor.BN],

      /// Functions
      ["sleep", PgCommon.sleep],

      /// Classes
      ["Keypair", web3.Keypair],
      ["PublicKey", web3.PublicKey],
      ["Connection", web3.Connection],

      /// Inherited objects from playground
      ["connection", connection],
      ["wallet", wallet],
    ];

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

    // Wallet
    if (wallet) {
      globals.push(["wallet", wallet]);

      // Anchor IDL
      const idl = PgProgramInfo.getProgramInfo().idl;
      if (idl) {
        globals.push(["program", PgTest.getProgram(idl, connection, wallet)]);
      }
    }

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

    // Allow top-level async, also helps detecting when tests finish
    code = `(async () => { try { await (async () => { ${code} })() } catch (e) { console.log("Uncaught error:", e.message) } finally { ${endCode} }})()`;

    // Transpile and inject the script to the iframe element
    scriptEl.textContent = transpile(code);

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
  }

  readonly DEFAULT_CLIENT = [
    "client.ts",
    `// Client
console.log("My address:", wallet.publicKey.toString());
const balance = await connection.getBalance(wallet.publicKey);
console.log(\`My balance: \${balance / web3.LAMPORTS_PER_SOL} SOL\`);`,
  ];

  readonly DEFAULT_TEST = [
    "index.test.ts",
    `describe("Test", () => {
  it("Airdrop", async () => {
    // Fetch my balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(\`My balance is \${balance} lamports\`)

    // Airdrop 1 SOL
    const airdropAmount = 1 * web3.LAMPORTS_PER_SOL;
    const txHash = await connection.requestAirdrop(wallet.publicKey, airdropAmount);

    // Confirm transaction
    await connection.confirmTransaction(txHash);

    // Fetch new balance
    const newBalance = await connection.getBalance(wallet.publicKey);
    console.log(\`New balance is \${newBalance} lamports\`);

    // Assert balances
    assert(balance + airdropAmount === newBalance);
  })
})`,
  ];
}

/** Words that are not allowed to be in the user code */
const _BLACKLISTED_WORDS = [
  "window",
  "this",
  "globalThis",
  "document",
  "location",
  "top",
  "chrome",
];
