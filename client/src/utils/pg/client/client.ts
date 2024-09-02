import { ScriptTarget, transpile } from "typescript";
import * as mocha from "mocha";
import * as util from "util";
import * as anchor from "@coral-xyz/anchor";

import { ClientPackageName, PgClientPackage } from "./package";
import { PgCommon } from "../common";
import { PgConnection } from "../connection";
import { PgProgramInfo } from "../program-info";
import { PgProgramInteraction } from "../program-interaction";
import { PgTerminal } from "../terminal";
import { CurrentWallet, PgWallet, StandardWallet } from "../wallet";
import type { MergeUnion, OrString } from "../types";
import type { PgWeb3 } from "../web3";

/** Options to use when running a script/test */
interface ClientParams {
  /** Name of the file to execute */
  fileName: string;
  /** JS/TS code to execute */
  code: string;
  /** Whether to run the script as a test */
  isTest: boolean;
}

export class PgClient {
  /**
   * Run or test JS/TS code.
   *
   * @param params client parameters
   */
  static async execute({ fileName, code, isTest }: ClientParams) {
    await this._executeBlocking(
      async () => {
        PgTerminal.log(`  ${fileName}:`);

        // Get Iframe window
        const iframeWindow = this._getIframeWindow();

        // Remove everything from the iframe window object
        for (const key in iframeWindow) {
          try {
            delete iframeWindow[key];
          } catch {
            // Not every key can be deleted from the window object
          }
        }

        // Get globals
        const { globals, endCode } = await this._getGlobals({ isTest });

        // Handle imports
        const importResult = await this._getImports(code);
        globals.push(...importResult.imports);
        code = importResult.code;

        // Set iframe globals
        for (const [name, pkg] of globals) {
          // @ts-ignore
          iframeWindow[name] = pkg;
        }

        // `describe` is only available when as test
        if (isTest && !code.includes("describe")) {
          throw new Error(
            `Tests must use '${PgTerminal.bold(
              "describe"
            )}' function. Use '${PgTerminal.bold(
              "run"
            )}' command to run the script.`
          );
        }

        // Handle blacklisted globals
        for (const keyword of BLACKLISTED_GLOBALS) {
          if (code.includes(keyword)) {
            throw new Error(`'${keyword}' is not allowed`);
          }
        }

        // Handle globals to set `undefined` to
        for (const keyword of UNDEFINED_GLOBALS) {
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
  catch (e) { console.log("Uncaught error:", e.message); }
  finally { ${endCode} }
})()`;

        // Transpile the code
        code = transpile(code, {
          target: ScriptTarget.ES5,
          removeComments: true,
        });

        // Create script element in the iframe
        const iframeDocument = iframeWindow.document;
        const scriptEls = iframeDocument.getElementsByTagName("script");
        if (scriptEls.length) iframeDocument.head.removeChild(scriptEls[0]);
        const scriptEl = document.createElement("script");
        iframeDocument.head.appendChild(scriptEl);

        return new Promise<void>((res) => {
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

          // Inject the script to the iframe element
          scriptEl.textContent = code;
        });
      },
      { isTest }
    );
  }

  /**
   * Wrapper method to control client running state.
   *
   * @param cb callback function to run
   * @param isTest whether to execute as a test
   */
  private static async _executeBlocking(
    cb: () => Promise<void>,
    { isTest }: Pick<ClientParams, "isTest">
  ) {
    // Block creating multiple client/test instances at the same time
    if (this._isClientRunning) {
      if (isTest) throw new Error("Please wait for client to finish.");
      throw new Error("Client is already running!");
    }
    // @ts-ignore
    if (mocha._state === "running") {
      if (!isTest) throw new Error("Please wait for tests to finish.");
      throw new Error("Tests are already running!");
    }

    try {
      if (!isTest) this._isClientRunning = true;
      await cb();
    } catch (e) {
      throw e;
    } finally {
      if (!isTest) this._isClientRunning = false;
    }
  }

  /**
   * Get or create the window object of the `Iframe` element.
   *
   * @returns `Iframe`'s window element
   */
  private static _getIframeWindow() {
    if (this._IframeWindow) return this._IframeWindow;

    const iframeEl = document.createElement("iframe");
    iframeEl.style.display = "none";
    document.body.appendChild(iframeEl);
    const iframeWindow = iframeEl.contentWindow;
    if (!iframeWindow) throw new Error("No iframe window");

    // Non runtime errors e.g. syntax
    iframeWindow.addEventListener("error", (ev) => {
      PgTerminal.log(`    ${ev.message}`);

      // This kind of error requires custom event dispatch to indicate the
      // client has finished running, otherwise client will stay in the running
      // state indefinitely.
      PgCommon.createAndDispatchCustomEvent(CLIENT_ON_DID_FINISH_RUNNING);
    });

    // Promise/async errors
    iframeWindow.addEventListener("unhandledrejection", (ev) => {
      PgTerminal.log(`    ${`Uncaught error: ${ev.reason.message}`}`);
      // Does not require custom event dispatch to indicate running has finished
    });

    this._IframeWindow = iframeWindow;

    return this._IframeWindow;
  }

  /**
   * Get global variables.
   *
   * @param isTest whether to execute as a test
   * @returns the globals and the end code to indicate when the execution is over
   */
  private static async _getGlobals({ isTest }: Pick<ClientParams, "isTest">) {
    // Redefine console inside the iframe to log in the terminal
    const log = (cb?: (text: string) => string) => {
      return (...args: any[]) => {
        return PgTerminal.log(
          "    " + (cb ? cb(util.format(...args)) : util.format(...args))
        );
      };
    };
    const iframeConsole = {
      log: log(),
      info: log(PgTerminal.info),
      warn: log(PgTerminal.warning),
      error: log(PgTerminal.error),
    };

    const globals: [string, object][] = [
      // Playground global
      ["pg", this._getPg()],

      // Namespaces
      ["console", iframeConsole],

      // https://github.com/solana-playground/solana-playground/issues/82
      ["Uint8Array", Uint8Array],

      // Functions
      ["sleep", PgCommon.sleep],
    ];

    // Set global packages
    await Promise.all(
      PgCommon.entries(PACKAGES.global).map(
        async ([packageName, importStyle]) => {
          const style = importStyle as Partial<MergeUnion<typeof importStyle>>;
          const pkg: { [name: string]: any } = await PgClientPackage.import(
            packageName
          );
          this._overridePackage(packageName, pkg);

          let global: typeof globals[number];
          if (style.as) global = [style.as, pkg];
          else if (style.named) global = [style.named, pkg[style.named]];
          else if (style.default) global = [style.default, pkg.default ?? pkg];
          else throw new Error("Unreachable");

          globals.push(global);
        }
      )
    );

    let endCode: string;
    if (isTest) {
      endCode = "_run()";

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
    } else {
      // Run only
      endCode = "__end()";
      globals.push([
        "__end",
        () => {
          PgCommon.createAndDispatchCustomEvent(CLIENT_ON_DID_FINISH_RUNNING);
        },
      ]);
    }

    return { globals, endCode };
  }

  /**
   * Handle user specified imports.
   *
   * @param code script/test code
   * @returns the imported packages and the code without the import statements
   */
  private static async _getImports(code: string) {
    const importRegex =
      /import\s+(?:((\*\s+as\s+(\w+))|({[\s+\w+\s+,]*})|(\w+))\s+from\s+)?["|'](.+)["|']/gm;
    let importMatch: RegExpExecArray | null;

    const imports: [string, object][] = [];
    const setupImport = (pkg: { [key: string]: any }) => {
      // `import as *` syntax
      if (importMatch?.[3]) {
        imports.push([importMatch[3], pkg]);
      }

      // `import {}` syntax
      else if (importMatch?.[4]) {
        const namedImports = importMatch[4]
          .substring(1, importMatch[4].length - 1)
          .replace(/\n?/g, "")
          .split(",")
          .map((statement) => statement.trim())
          .filter(Boolean)
          .map((statement) => {
            const result = /(\w+)(\s+as\s+(\w+))?/.exec(statement)!;
            return { named: result[1], renamed: result[3] };
          });
        for (const { named, renamed } of namedImports) {
          imports.push([renamed ?? named, pkg[named]]);
        }
      }

      // `import Default` syntax
      else if (importMatch?.[5]) {
        imports.push([importMatch[5], pkg.default ?? pkg]);
      }
    };

    do {
      importMatch = importRegex.exec(code);
      if (!importMatch) continue;

      const importPath = importMatch[6];
      const getPackage = importPath.startsWith(".")
        ? this._importFromPath
        : PgClientPackage.import;
      const pkg = await getPackage(importPath);
      this._overridePackage(importPath, pkg);
      setupImport(pkg);
    } while (importMatch);

    // Remove import statements
    // Need to do this after we setup all the imports because of the internal
    // cursor index state the `regex.exec` has.
    code = code.replace(importRegex, "");

    return { code, imports };
  }

  /**
   * Import module from the given path.
   *
   * @param path import path
   * @returns the imported module
   */
  private static async _importFromPath(path: string) {
    // TODO: Remove after adding general support for local imports.
    // Add a special case for Anchor's `target/types`
    if (path.includes("target/types")) {
      if (PgProgramInfo.idl) return { IDL: PgProgramInfo.idl };
      throw new Error("IDL not found, build the program to create the IDL.");
    }

    throw new Error("File imports are not yet supported.");
  }

  /**
   * Override the package.
   *
   * NOTE: This method mutates the given `pkg` in place.
   *
   * @param name package name
   * @param pkg package
   * @returns the overridden package
   */
  private static _overridePackage(name: OrString<ClientPackageName>, pkg: any) {
    // Anchor
    if (name === "@coral-xyz/anchor" || name === "@project-serum/anchor") {
      const providerName =
        name === "@coral-xyz/anchor" ? "AnchorProvider" : "Provider";

      // Add `AnchorProvider.local()`
      pkg[providerName].local = (
        url?: string,
        opts: PgWeb3.ConfirmOptions = anchor.AnchorProvider.defaultOptions()
      ) => {
        const connection = PgConnection.create({
          endpoint: url ?? "http://localhost:8899",
          commitment: opts.commitment,
        });

        const wallet = this._getPg().wallet;
        if (!wallet) throw new Error("Wallet not connected");

        const provider = new anchor.AnchorProvider(connection, wallet, opts);
        return setAnchorWallet(provider);
      };

      // Add `AnchorProvider.env()`
      pkg[providerName].env = () => {
        const provider = this._getPg().program?.provider;
        if (!provider) throw new Error("Provider not ready");
        return setAnchorWallet(provider);
      };

      /**
       * Override `provider.wallet` to have `payer` field with the wallet
       * keypair in order to have the same behavior as local.
       */
      const setAnchorWallet = (provider: any) => {
        if (provider.wallet.isPg) {
          provider.wallet = {
            ...provider.wallet,
            payer: provider.wallet.keypair,
          };
        }

        return provider;
      };

      // Add `anchor.workspace`
      if (PgProgramInfo.idl) {
        const snakeCaseName = PgProgramInfo.idl.name;
        const names = [
          PgCommon.toPascalFromSnake(snakeCaseName), // default before 0.29.0
          PgCommon.toCamelFromSnake(snakeCaseName),
          PgCommon.toKebabFromSnake(snakeCaseName),
          snakeCaseName,
        ];

        pkg.workspace = {};
        for (const name of names) {
          if (pkg.workspace[name]) continue;
          Object.defineProperty(pkg.workspace, name, {
            get: () => {
              let program = this._getPg().program;
              if (program) {
                const { idl, programId } = program;
                program = new anchor.Program(idl, programId, pkg.getProvider());
              }
              return program;
            },
          });
        }
      }
    }

    return pkg;
  }

  /**
   * Get `pg` global object.
   *
   * @returns the `pg` global object
   */
  private static _getPg() {
    /** Utilities to be available under the `pg` namespace */
    interface Pg {
      /** Playground connection instance */
      connection: PgWeb3.Connection;
      /** Current connected wallet */
      wallet?: CurrentWallet;
      /** All available wallets, including the standard wallets */
      wallets?: Record<string, CurrentWallet | StandardWallet>;
      /** Current project's program public key */
      PROGRAM_ID?: PgWeb3.PublicKey;
      /** Anchor program instance of the current project */
      program?: anchor.Program;
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
      pg.program = PgProgramInteraction.getAnchorProgram();
    }

    return pg;
  }

  /** Whether a script is currently running */
  private static _isClientRunning: boolean;

  /** Cached `Iframe` `Window` object */
  private static _IframeWindow: Window;
}

/** Keywords that are not allowed to be in the user code */
const BLACKLISTED_GLOBALS = [
  "window",
  "globalThis",
  "document",
  "location",
  "top",
  "chrome",
];

/** Globals that will be set to `undefined` */
const UNDEFINED_GLOBALS = ["eval", "Function"];

/** Event name that will be dispatched when client code completes executing */
const CLIENT_ON_DID_FINISH_RUNNING = "clientondidfinishrunning";
