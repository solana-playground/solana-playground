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
  /**
   * Run or test js/ts code
   *
   * @param code Client code to run/test
   * @param wallet Playground or Anchor Wallet
   * @param connection Current connection
   * @param opts
   * - test: whether to run the code as test
   *
   * @returns A promise that will resolve once all tests are finished
   */
  static async run(
    code: string,
    wallet: PgWallet | AnchorWallet | null,
    connection: web3.Connection,
    opts?: { isTest?: boolean }
  ): Promise<void> {
    const isTest = opts?.isTest;
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
    PgTerminal.logWasm(
      PgTerminal.info(`Running ${isTest ? "tests" : "client"}...`)
    );

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
    let padding = "";
    if (isTest) padding = "    ";
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

    let finished = false;

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
      globals.push(["_finish", () => (finished = true)]);

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

    for (const blacklistedWord of this._blacklistedWords) {
      if (code.includes(blacklistedWord)) {
        throw new Error(`'${blacklistedWord}' is not allowed`);
      }
    }

    // Allow top-level async, also helps detecting when tests finish
    code = `(async () => { try { await ${code} } catch (e) { console.log("Uncaught error:", e.message) } finally { ${endCode} }})()`;

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
          if (finished) {
            clearInterval(intervalId);
            res();
          }
        }, 1000);
      }
    });
  }

  /** Words that are not allowed to be in the user code */
  private static readonly _blacklistedWords = [
    "window",
    "this",
    "globalThis",
    "document",
    "location",
    "top",
    "chrome",
  ];
}
