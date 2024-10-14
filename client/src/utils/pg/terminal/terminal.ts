import { ITerminalOptions, Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { format } from "util";

import { PgAutocomplete } from "./autocomplete";
import { PgHistory } from "./history";
import { PgShell } from "./shell";
import { PgTty } from "./tty";
import {
  Emoji,
  EventName,
  GITHUB_URL,
  OTHER_ERROR,
  PROGRAM_ERROR,
  PROJECT_NAME,
  RPC_ERROR,
  SERVER_ERROR,
} from "../../../constants";
import { PgCommon } from "../common";
import type { CommandManager, PrintOptions } from "./types";
import type { Methods, ClassReturnType, SyncOrAsync } from "../types";

export class PgTerminal {
  /** Welcome text */
  static readonly DEFAULT_TEXT = [
    `Welcome to ${PgTerminal.bold(PROJECT_NAME)}.`,
    `Popular crates for Solana development are available to use.`,
    `See the list of available crates and request new crates from ${PgTerminal.underline(
      GITHUB_URL
    )}`,
    `Type ${PgTerminal.bold("help")} to see all commands.\n`,
  ].join("\n\n");

  /** Default prompt string before entering commands */
  static readonly PROMPT_PREFIX = "$ ";

  /** Prompt after `\` or `'` */
  static readonly CONTINUATION_PROMPT_PREFIX = "> ";

  /** Prefix for the waiting user input prompt message */
  static readonly WAITING_INPUT_MSG_PREFIX = "? ";

  /** Prompt prefix for waiting user input */
  static readonly WAITING_INPUT_PROMPT_PREFIX = ">> ";

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
  static async log(msg: any, opts?: PrintOptions) {
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
    this.log(msg);
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
      this.log(`Process error: ${e?.message ? e.message : e}`);
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
      PgCommon.getStaticEventNames(EventName.TERMINAL_STATIC).get
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
      PgCommon.getStaticEventNames(EventName.TERMINAL_STATIC).run,
      data
    );
  }

  /**
   * Set progressbar percentage.
   *
   * Progress bar will be hidden if `progress` is set to 0.
   *
   * @param progress progress percentage in 0-100
   */
  static setProgress(progress: number) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.TERMINAL_PROGRESS_SET,
      progress
    );
  }

  /**
   * Redifined console.log for showing mocha logs in the playground terminal
   */
  static consoleLog(msg: string, ...rest: any[]) {
    _log(msg, ...rest);

    if (msg !== undefined) {
      // We only want to log mocha logs to the terminal
      const fullMessage = format(msg, ...rest);
      if (fullMessage.startsWith("  ")) {
        const editedMessage = fullMessage
          // Replace checkmark icon
          .replace(Emoji.CHECKMARK, PgTerminal.success("✔ "))
          // Make '1) testname' red
          .replace(/\s+\d\)\s\w*$/, (match) => PgTerminal.error(match))
          // Passing text
          .replace(/\d+\spassing/, (match) => PgTerminal.success(match))
          // Failing text
          .replace(/\d+\sfailing/, (match) => PgTerminal.error(match))
          // Don't show the stack trace because it shows the transpiled code
          // TODO: show where the error actually happened in user code
          .replace(/\s+at.*$/gm, "");

        PgTerminal.log(editedMessage);
      }
    }
  }
}

// Keep the default console.log
const _log = console.log;

export class PgTerm {
  private _xterm: XTerm;
  private _container: HTMLElement | null;
  private _fitAddon: FitAddon;
  private _tty: PgTty;
  private _shell: PgShell;
  private _autocomplete: PgAutocomplete;
  private _isOpen: boolean;

  constructor(cmdManager: CommandManager, xtermOptions?: ITerminalOptions) {
    // Create xterm element
    this._xterm = new XTerm(xtermOptions);

    // Container is empty at start
    this._container = null;

    // Load xterm addons
    this._fitAddon = new FitAddon();
    this._xterm.loadAddon(this._fitAddon);
    this._xterm.loadAddon(new WebLinksAddon());

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
      history
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
  }

  /** Open terminal */
  open(container: HTMLElement) {
    this._container = container;

    this._xterm.open(container);
    this._xterm.attachCustomKeyEventHandler(this._handleCustomEvent);
    this._isOpen = true;

    // Fit terminal
    this.fit();

    // Print welcome text
    this.println(PgTerminal.DEFAULT_TEXT);

    // Prompt
    this.enable();
  }

  /** Fit terminal */
  fit() {
    this._fitAddon.fit();
  }

  /** Focus terminal and scroll to cursor */
  focus() {
    this._xterm.focus();
    this.scrollToCursor();
  }

  /** Scroll terminal to wherever the cursor currently is */
  scrollToCursor() {
    if (!this._container) {
      return;
    }

    // We don't need `cursorX`, since we want to start at the beginning of the terminal
    const cursorY = this._tty.buffer.cursorY;
    const size = this._tty.size;

    const containerBoundingClientRect = this._container.getBoundingClientRect();

    // Find how much to scroll because of our cursor
    const cursorOffsetY =
      (cursorY / size.rows) * containerBoundingClientRect.height;

    let scrollX = containerBoundingClientRect.left;
    let scrollY = containerBoundingClientRect.top + cursorOffsetY + 10;

    if (scrollX < 0) {
      scrollX = 0;
    }
    if (scrollY > document.body.scrollHeight) {
      scrollY = document.body.scrollHeight;
    }

    window.scrollTo(scrollX, scrollY);
  }

  /** Print a message */
  print(msg: any, opts?: PrintOptions) {
    if (typeof msg === "string") {
      // For some reason, double new lines are not respected. Thus, fixing that here
      msg = msg.replace(/\n\n/g, "\n \n");
    }

    if (!this._isOpen) {
      return;
    }

    if (this._shell.isPrompting()) {
      // Cancel the current prompt and restart
      this._shell.printAndRestartPrompt(() => {
        this._tty.print(msg + "\n", opts);
      });
      return;
    }

    this._tty.print(msg, opts);
  }

  /** Print a message with end line character appended */
  println(msg: any, opts?: PrintOptions) {
    this.print(msg, { ...opts, newLine: true });
  }

  /**
   * Clear terminal screen. This will move the cursor to the top of the terminal
   * but will not clear xterm buffer by default.
   *
   * @param opts.full whether to fully clean xterm buffer
   *
   */
  clear(opts?: { full?: boolean }) {
    this._tty.clearTty();
    if (opts?.full) {
      this._tty.clear();
    } else {
      this._tty.print(`${PgTerminal.PROMPT_PREFIX}${this._tty.input}`);
    }
  }

  /**
   * Disable shell:
   * - Disables shell
   * - Clears current line for  for actions that were committed from outside of terminal
   * like pressing build button
   */
  disable() {
    this._shell.disable();
    this._tty.clearLine();
  }

  /** Enable shell */
  enable() {
    this._shell.enable();
  }

  /** Scroll the terminal to bottom */
  scrollToBottom() {
    this._xterm.scrollToBottom();
  }

  /** Destroy xterm instance */
  destroy() {
    this._xterm.dispose();
    // @ts-ignore
    delete this._xterm;
  }

  /**
   * Wait for user input
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
    let restore;
    if (opts?.default) {
      const value = opts.default;
      convertedMsg += ` (default: ${value})`;
      restore = this._autocomplete.temporarilySetHandlers([value], {
        append: true,
      }).restore;
    }
    if (opts?.choice) {
      // Show multi choice items
      const items = opts.choice.items;
      convertedMsg += items.reduce(
        (acc, cur, i) => acc + `\n[${i}] - ${cur}`,
        "\n"
      );
      restore = this._autocomplete.temporarilySetHandlers(
        items.map((_, i) => i.toString())
      ).restore;
    } else if (opts?.confirm) {
      convertedMsg += PgTerminal.secondaryText(` [yes/no]`);
      restore = this._autocomplete.temporarilySetHandlers([
        "yes",
        "no",
      ]).restore;
    }

    let userInput;
    try {
      userInput = await this._shell.waitForUserInput(convertedMsg);
    } finally {
      restore?.();
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

    this._tty.changeLine(PgTerminal.WAITING_INPUT_PROMPT_PREFIX + visibleText);
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
