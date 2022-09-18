import { transpile } from "typescript";
import * as assert from "assert";
import * as util from "util";
import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import { PgTest } from "./test";
import { PgTerminal } from "../terminal";
import { PgProgramInfo } from "../program-info";
import { PgWallet } from "../wallet";
import { PgCommon } from "../common";

export class PgClient {
  /**
   * Run js/ts code
   *
   * @param code Client code to test
   * @returns A promise that will resolve once all tests are finished
   */
  static async run(
    code: string,
    wallet: PgWallet | AnchorWallet | null,
    connection: web3.Connection
  ): Promise<void> {
    const iframeEls = document.getElementsByTagName("iframe");
    if (!iframeEls.length) throw new Error("No iframe element");
    const iframeWindow = (iframeEls[0] as HTMLIFrameElement).contentWindow;
    if (!iframeWindow) throw new Error("No iframe window");

    // Remove everything from the iframe window object
    for (const key in iframeWindow) {
      try {
        delete iframeWindow[key];
      } catch {}
    }

    // Redefine console inside the iframe to log in the terminal
    // @ts-ignore
    iframeWindow["console"] = {
      log: (msg: string, ...rest: any[]) => {
        PgTerminal.logWasm(util.format(msg, ...rest));
      },
      error: (msg: string, ...rest: any[]) => {
        PgTerminal.logWasm(PgTerminal.error(util.format(msg, ...rest)));
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

      /// Internal
      ["_finish", () => (finished = true)],
    ];

    // Wallet
    if (wallet) {
      globals.push(["wallet", wallet]);

      // Anchor
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

    // Inject script into the iframe
    const iframeDocument = iframeWindow.document;
    const scriptEls = iframeDocument.getElementsByTagName("script");
    if (scriptEls.length) {
      iframeDocument.head.removeChild(scriptEls[0]);
    }
    const scriptEl = document.createElement("script");
    iframeDocument.head.appendChild(scriptEl);

    // Tests should not have access to window object
    const blacklistedWords = [
      "window",
      "this",
      "globalThis",
      "document",
      "location",
      "top",
      "chrome",
    ];
    for (const blacklistedWord of blacklistedWords) {
      if (code.includes(blacklistedWord)) {
        throw new Error(`'${blacklistedWord}' is not allowed`);
      }
    }

    // Allow top-level async, also helps detecting when tests finish
    code = `(async () => { try { await ${code} } catch (e) { console.error("Error:", e.message) }; _finish()})()`;

    scriptEl.textContent = transpile(code);

    return new Promise((res) => {
      const intervalId = setInterval(() => {
        if (finished) {
          clearInterval(intervalId);
          res();
        }
      }, 1000);
    });
  }
}
