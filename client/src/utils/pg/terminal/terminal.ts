import { ITerminalOptions, Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";

import { PgAutocomplete } from "./autocomplete";
import { PgHistory } from "./history";
import { PgShell } from "./shell";
import { PgTty } from "./tty";
import {
  OTHER_ERROR,
  PROGRAM_ERROR,
  RPC_ERROR,
  SERVER_ERROR,
} from "../../../constants";
import { PgCommon } from "../common";
import type { CommandManager, Prefixes, PrintOptions } from "./types";
import type { Methods, ClassReturnType, SyncOrAsync } from "../types";

export class PgTerminal {
  /** All terminal event names */
  static events = {
    STATIC: "terminalstatic",
  };

  static success(text: string) {
    return `\x1b[1;32m${text}\x1b[0m`;
  }

  static error(text: string) {
    return `\x1b[1;31m${text}\x1b[0m`;
  }

  static warning(text: string) {
    return `\x1b[1;33m${text}\x1b[0m`;
  }

  static info(text: string) {
    return `\x1b[1;34m${text}\x1b[0m`;
  }

  static primary(text: string) {
    return `\x1b[1;35m${text}\x1b[0m`;
  }

  static secondary(text: string) {
    return `\x1b[1;36m${text}\x1b[0m`;
  }

  static secondaryText(text: string) {
    return `\x1b[30m${text}\x1b[0m`;
  }

  static bold(text: string) {
    return `\x1b[1m${text}\x1b[0m`;
  }

  static italic(text: string) {
    return `\x1b[3m${text}\x1b[0m`;
  }

  static underline(text: string) {
    return `\x1b[4m${text}\x1b[0m`;
  }

  /**
   * Make error messages more friendly
   */
  static convertErrorMessage(msg: string) {
    // Hex program errors
    for (const programErrorCode in PROGRAM_ERROR) {
      if (msg.endsWith("0x" + programErrorCode.toLowerCase())) {
        const parts = msg.split(":");

        let ixIndex = parts[2][parts[2].length - 1];
        if (!PgCommon.isInt(ixIndex)) ixIndex = "0";
        const programError = PROGRAM_ERROR[programErrorCode];

        msg = `\n${this.bold("Instruction index:")} ${ixIndex}\n${this.bold(
          "Reason:"
        )} ${programError}`;

        return msg;
      }
    }

    // Descriptive program errors
    if (msg.startsWith("failed to send")) {
      const parts = msg.split(":");
      // With ix index
      if (parts.length === 4) {
        const ixIndex = parts[2][parts[2].length - 1];
        const programError = parts[3][1].toUpperCase() + parts[3].substring(2);

        msg = `\n${this.bold("Instruction index:")} ${ixIndex}\n${this.bold(
          "Reason:"
        )} ${programError}.`;

        return msg;
      }

      // Without ix index
      const programError = parts[2][1].toUpperCase() + parts[2].substring(2);
      msg = `\n${this.bold("Reason:")} ${programError}.`;

      return msg;
    }

    // Rpc errors
    for (const rpcError in RPC_ERROR) {
      if (msg.includes(rpcError)) {
        msg = RPC_ERROR[rpcError];
        return msg;
      }
    }

    // Server errors
    for (const serverError in SERVER_ERROR) {
      if (msg === serverError) {
        msg = SERVER_ERROR[serverError];
        return msg;
      }
    }

    // Other errors
    for (const otherError in OTHER_ERROR) {
      if (msg === otherError) {
        msg = OTHER_ERROR[otherError];
        return msg;
      }
    }

    return msg;
  }

  /** Get whether the terminal is focused or in blur. */
  static isFocused() {
    return document
      .getElementsByClassName("terminal xterm xterm-dom-renderer-owner-1")[0]
      ?.classList.contains("focus");
  }

  /** Dispatch enable terminal custom event. */
  static async enable() {
    await PgTerminal.run({ enable: [] });
  }

  /** Dispatch disable terminal custom event. */
  static async disable() {
    await PgTerminal.run({ disable: [] });
  }

  /** Log terminal messages from anywhere. */
  static async println(msg: any, opts?: PrintOptions) {
    await PgTerminal.run({ println: [msg, opts] });
  }

  /** Dispatch focus terminal custom event. */
  static async focus() {
    await PgTerminal.run({ focus: [] });
  }

  /** Dispatch focus terminal custom event. */
  static async clear() {
    await PgTerminal.run({ clear: [] });
  }

  // TODO: Remove
  /**
   * Log terminal messages from anywhere
   *
   * Mainly used from WASM
   */
  static logWasm(msg: any) {
    this.println(msg);
  }

  /** Dispatch scroll to bottom custom event. */
  static async scrollToBottom() {
    await PgTerminal.run({ scrollToBottom: [] });
  }

  /** Execute the given command from string. */
  static async executeFromStr(...args: Parameters<PgTerm["executeFromStr"]>) {
    const term = await PgTerminal.get();
    return await term.executeFromStr(...args);
  }

  /**
   * Wrapper function for commands that interact with the terminal
   *
   * This function should be used as a wrapper function when calling any
   * terminal command.
   */
  static async process<T>(cb: () => SyncOrAsync<T>) {
    this.disable();
    this.scrollToBottom();
    try {
      return await cb();
    } catch (e: any) {
      this.println(`Process error: ${e?.message ? e.message : e}`);
    } finally {
      this.enable();
    }
  }

  /**
   * Statically get the terminal object from state
   *
   * @returns the terminal object
   */
  static async get() {
    return await PgCommon.sendAndReceiveCustomEvent<PgTerm>(
      PgCommon.getStaticEventNames(PgTerminal.events.STATIC).get
    );
  }

  /**
   * Run any method of terminal in state from anywhere
   *
   * @param data method and its data to run
   * @returns the result from the method call
   */
  static async run<
    R extends ClassReturnType<PgTerm, keyof M>,
    M extends Methods<PgTerm>
  >(data: M) {
    return await PgCommon.sendAndReceiveCustomEvent<R, M>(
      PgCommon.getStaticEventNames(PgTerminal.events.STATIC).run,
      data
    );
  }

  /**
   * Format the given list for terminal view.
   *
   * @param list list to format
   * @returns the formatted list
   */
  static formatList(
    list: Array<string[] | { name: string; description?: string }>,
    opts?: { align?: "x" | "y" }
  ) {
    const { align } = PgCommon.setDefault(opts, { align: "x" });
    return list
      .map((item) =>
        Array.isArray(item) ? item : [item.name, item.description ?? ""]
      )
      .sort((a, b) => {
        const allowedRegex = /^[a-zA-Z-]+$/;
        if (!allowedRegex.test(a[0])) return 1;
        if (!allowedRegex.test(b[0])) return -1;
        return a[0].localeCompare(b[0]);
      })
      .reduce((acc, items) => {
        const output = items.reduce((acc, col, i) => {
          const MAX_CHARS = 80;

          const chunks: string[][] = [];
          const words = col.split(" ");
          let j = 0;
          for (let i = 0; i < words.length; i++) {
            while (
              words[j] &&
              [...(chunks[i] ?? []), words[j]].join(" ").length <= MAX_CHARS
            ) {
              chunks[i] ??= [];
              chunks[i].push(words[j]);
              j++;
            }
          }

          if (align === "x") {
            const WHITESPACE_LEN = 24;
            return (
              acc +
              chunks.reduce(
                (acc, row, i) =>
                  acc +
                  (i ? "\n\t" + " ".repeat(WHITESPACE_LEN) : "") +
                  row.join(" "),
                ""
              ) +
              " ".repeat(Math.max(WHITESPACE_LEN - col.length, 0))
            );
          }

          return (
            acc +
            (i ? "\n\t" : "") +
            chunks.reduce(
              (acc, row, i) => acc + (i ? "\n\t" : "") + row.join(" "),
              ""
            )
          );
        }, "");

        return acc + "\t" + output + "\n";
      }, "");
  }
}

export class PgTerm {
  private _xterm: XTerm;
  private _fitAddon: FitAddon;
  private _tty: PgTty;
  private _shell: PgShell;
  private _autocomplete: PgAutocomplete;
  private _isOpen: boolean;
  private _prefixes: Prefixes;
  private _defaultText?: string;

  constructor(
    cmdManager: CommandManager,
    opts?: {
      xterm?: ITerminalOptions;
      prefixes?: Partial<Prefixes>;
      defaultText?: string;
    }
  ) {
    // Create xterm instance
    this._xterm = new XTerm(opts?.xterm);

    // Load xterm addons
    this._fitAddon = new FitAddon();
    this._xterm.loadAddon(this._fitAddon);
    this._xterm.loadAddon(new WebLinksAddon());

    // Set prefixes
    this._prefixes = PgCommon.setDefault(opts?.prefixes, {
      prompt: "$ ",
      continuationPrompt: "> ",
      waitingInputPrompt: ">> ",
      waitingInputMsg: "? ",
    });

    // Create Shell and TTY
    const history = new PgHistory(20);
    this._autocomplete = new PgAutocomplete([
      cmdManager.getCompletions(),
      () => history.getEntries(),
    ]);
    this._tty = new PgTty(this._xterm, cmdManager, this._autocomplete);
    this._shell = new PgShell(
      this._tty,
      cmdManager,
      this._autocomplete,
      history,
      this._prefixes
    );

    // Add a custom resize handler that clears the prompt using the previous
    // configuration, updates the cached terminal size information and then
    // re-renders the input. This leads (most of the times) into a better
    // formatted input.
    //
    // Also stops multiline inputs rendering unnecessarily.
    this._xterm.onResize(({ rows, cols }) => {
      this._tty.clearInput();
      this._tty.setTermSize(cols, rows);
      this._tty.setInput(this._tty.input, true);
    });

    // Add a custom key handler in order to fix a bug with spaces
    this._xterm.onKey((ev) => {
      if (ev.key === " ") {
        ev.domEvent.preventDefault();
        return false;
      }
    });

    // Any data event (key, paste...)
    this._xterm.onData(this._shell.handleTermData);

    this._isOpen = false;
    this._defaultText = opts?.defaultText;
  }

  /** Open terminal. */
  open(container: HTMLElement) {
    this._xterm.open(container);
    this._xterm.attachCustomKeyEventHandler(this._handleCustomEvent);
    this._isOpen = true;

    // Fit terminal
    this.fit();

    // Print default text
    if (this._defaultText) this.println(this._defaultText);

    // Prompt
    this.enable();
  }

  /** Fit terminal. */
  fit() {
    this._fitAddon.fit();
  }

  /** Focus terminal and scroll to cursor. */
  focus() {
    this._xterm.focus();
    this.scrollToCursor();
  }

  /** Scroll terminal to wherever the cursor currently is. */
  scrollToCursor() {
    const scrollableEl = document
      .getElementsByClassName("xterm-viewport")
      .item(0);
    if (!scrollableEl) throw new Error("XTerm viewport not found");

    // Find how much to scroll because of our cursor
    const rect = scrollableEl.getBoundingClientRect();
    const cursorOffsetY =
      (this._tty.buffer.cursorY / this._tty.size.rows) * rect.height;

    let scrollX = rect.left;
    let scrollY = rect.top + cursorOffsetY + 10;
    if (scrollX < 0) {
      scrollX = 0;
    }
    if (scrollY > document.body.scrollHeight) {
      scrollY = document.body.scrollHeight;
    }

    scrollableEl.scrollTo(scrollX, scrollY);
  }

  /** Print a message. */
  print(msg: any, opts?: PrintOptions) {
    if (!this._isOpen) return;

    if (this._shell.isPrompting()) {
      // Cancel the current prompt and restart
      this._shell.printAndRestartPrompt(() => {
        this._tty.print(msg + "\n", opts);
      });
    } else {
      this._tty.print(msg, opts);
    }
  }

  /** Print a message with end line character appended. */
  println(msg: any, opts?: PrintOptions) {
    this.print(msg, { ...opts, newLine: true });
  }

  /**
   * Clear terminal screen. This will move the cursor to the top of the terminal
   * but will not clear xterm buffer by default.
   *
   * @param opts.full whether to fully clean xterm buffer
   */
  clear(opts?: { full?: boolean }) {
    this._tty.clearTty();
    if (opts?.full) {
      this._tty.clear();
    } else {
      this._tty.print(`${this._prefixes.prompt}${this._tty.input}`);
    }
  }

  /** Disable shell and clear the current line. */
  disable() {
    this._shell.disable();
    this._tty.clearLine();
  }

  /** Enable shell. */
  enable() {
    this._shell.enable();
  }

  /** Scroll the terminal to bottom. */
  scrollToBottom() {
    this._xterm.scrollToBottom();
  }

  /** Destroy the current xterm instance. */
  destroy() {
    this._xterm.dispose();
    // @ts-ignore
    delete this._xterm;
  }

  /**
   * Wait for user input.
   *
   * @param msg message to print to the terminal before prompting user
   * @param opts -
   * - allowEmpty: whether to allow the input to be empty
   * - choice.items: set of values to choose from. Returns the selected index if
   * `allowMultiple` is not specified.
   * - choice.allowMultiple: whether to allow multiple choices. Returns the indices.
   * - confirm: yes/no question. Returns the result as boolean.
   * - default: default value to set
   * - validator: callback function to validate the user input
   * @returns user input
   */
  async waitForUserInput<
    O extends {
      allowEmpty?: boolean;
      confirm?: boolean;
      default?: string;
      choice?: {
        items: string[];
        allowMultiple?: boolean;
      };
      validator?: (
        userInput: string
      ) => boolean | void | Promise<boolean | void>;
    }
  >(
    msg: string,
    opts?: O
  ): Promise<
    O["confirm"] extends boolean
      ? boolean
      : O["choice"] extends object
      ? O["choice"]["allowMultiple"] extends boolean
        ? number[]
        : number
      : string
  > {
    this.focus();

    let convertedMsg = msg;
    const restoreHandlers = [];
    if (opts?.choice) {
      // Show multi choice items
      const items = opts.choice.items;
      convertedMsg += items.reduce(
        (acc, cur, i) => acc + `\n[${i}] - ${cur}`,
        "\n"
      );
      restoreHandlers.push(
        this._autocomplete.temporarilySetHandlers(
          items.map((_, i) => i.toString())
        )
      );
    } else if (opts?.confirm) {
      // Confirm is a special case choice
      convertedMsg += PgTerminal.secondaryText(` [yes/no]`);
      restoreHandlers.push(
        this._autocomplete.temporarilySetHandlers(["yes", "no"])
      );
    }

    if (opts?.default) {
      const value = opts.default;
      convertedMsg += ` (default: ${value})`;
      restoreHandlers.push(
        this._autocomplete.temporarilySetHandlers([value], { append: true })
      );
    }

    let userInput;
    try {
      userInput = await this._shell.waitForUserInput(convertedMsg);
    } finally {
      restoreHandlers.reverse().forEach(({ restore }) => restore());
    }

    // Set the input to the default if it exists on empty input
    if (!userInput && opts?.default) userInput = opts.default;

    // Default validators
    if (opts && !opts.validator) {
      // Validate confirm
      if (opts.confirm) {
        opts.validator = (input) => input === "yes" || input === "no";
      }

      // Validate multi choice
      if (opts.choice) {
        const choiceMaxLength = opts.choice.items.length - 1;
        opts.validator = (input) => {
          const parsed: number[] = JSON.parse(`[${input}]`);
          return (
            (opts.choice?.allowMultiple ? true : parsed.length === 1) &&
            parsed.every(
              (v) =>
                PgCommon.isInt(v.toString()) && v >= 0 && v <= choiceMaxLength
            )
          );
        };
      }
    }

    // Allow empty
    if (!userInput && !opts?.allowEmpty) {
      this.println(PgTerminal.error("Can't be empty.\n"));
      return await this.waitForUserInput(msg, opts);
    }

    // Validator
    if (opts?.validator && userInput) {
      try {
        if ((await opts.validator(userInput)) === false) {
          this.println(
            PgTerminal.error(`'${userInput}' is not a valid value.\n`)
          );
          return await this.waitForUserInput(msg, opts);
        }
      } catch (e: any) {
        this.println(
          PgTerminal.error(`${e.message || `Validation failed: ${e}`}\n`)
        );
        return await this.waitForUserInput(msg, opts);
      }
    }

    // Return value
    let returnValue;

    // Confirm
    if (opts?.confirm) {
      returnValue = userInput === "yes" ? true : false;
    }
    // Multichoice
    else if (opts?.choice) {
      if (opts.choice.allowMultiple) {
        returnValue = JSON.parse(`[${userInput}]`);
      } else {
        returnValue = parseInt(userInput);
      }
    }
    // Default as string
    else {
      returnValue = userInput;
    }

    const visibleText =
      returnValue?.length === 0
        ? PgTerminal.secondaryText("empty")
        : PgTerminal.success(userInput);

    this._tty.changeLine(this._prefixes.waitingInputPrompt + visibleText);
    return returnValue;
  }

  /**
   * Write the given input in the terminal and press `Enter`
   *
   * @param cmd command to run
   * @param clearCmd whether to clean the command afterwards - defaults to `true`
   */
  async executeFromStr(cmd: string, clearCmd?: boolean) {
    this._tty.setInput(cmd);
    return await this._shell.handleReadComplete(clearCmd);
  }

  /**
   * Handle custom keyboard events. Only runs when terminal is in focus.
   *
   * @param ev keyboard event
   * @returns whether to keep the defaults
   *
   * NOTE: This function is intentionally uses arrow functions for `this` to be
   * defined from the outer class (PgTerm) otherwise `this` is being defined from
   * XTerm's instance
   */
  private _handleCustomEvent = (ev: KeyboardEvent) => {
    if (PgCommon.isKeyCtrlOrCmd(ev) && ev.type === "keydown") {
      const key = ev.key.toUpperCase();

      switch (key) {
        case "C":
          if (ev.shiftKey) {
            ev.preventDefault();
            const selection = this._xterm.getSelection();
            navigator.clipboard.writeText(selection);
            return false;
          }

          return true;

        case "V":
          // Ctrl+Shift+V does not work with Firefox but works with Chromium.
          // We fallback to Ctrl+V for Firefox
          if (ev.shiftKey || PgCommon.getBrowser() === "Firefox") return false;

          return true;

        case "L":
        case "M":
        case "J":
          return false;
      }
    }

    return true;
  };
}
