import PgTty from "./tty";
import ShellHistory from "./shell-history";
import {
  ActiveCharPrompt,
  ActivePrompt,
  closestLeftBoundary,
  closestRightBoundary,
  collectAutocompleteCandidates,
  hasTrailingWhitespace,
  isIncompleteInput,
} from "./shell-utils";
import { TerminalAction } from "../../../state";
import { PgTerminal, Wasm, WasmPkg } from "./terminal";
import { PgWallet } from "../wallet";

type AutoCompleteHandler = (index: number, tokens: string[]) => string[];
type ShellOptions = { historySize: number; maxAutocompleteEntries: number };

/**
 * A shell is the primary interface that is used to start other programs.
 * It's purpose to handle:
 * - Job control (control of child processes),
 * - Line editing and history
 * - Output text to the tty -> terminal
 * - Interpret text within the tty to launch processes and interpret programs
 */
export default class PgShell {
  pgTty: PgTty;
  history: ShellHistory;

  maxAutocompleteEntries: number;
  _autocompleteHandlers: AutoCompleteHandler[];
  _active: boolean;
  _activePrompt?: ActivePrompt;
  _activeCharPrompt?: ActiveCharPrompt;
  _wasm?: Wasm;

  constructor(
    pgTty: PgTty,
    options: ShellOptions = {
      historySize: 30,
      maxAutocompleteEntries: 100,
    }
  ) {
    this.pgTty = pgTty;
    this.history = new ShellHistory(options.historySize);

    this.maxAutocompleteEntries = options.maxAutocompleteEntries;
    this._autocompleteHandlers = [
      (index, tokens) => {
        return this.history.entries;
      },
    ];
    this._active = false;
  }

  /**
   * This function runs when user presses `Enter` in terminal
   * @returns if the command is valid
   */
  _parseCommand(cmd: string) {
    cmd = cmd.trim();
    let isCmdValid = false;
    if (cmd === "help") {
      PgTerminal.logWasm(PgTerminal.HELP_TEXT);
      this.enable();
      isCmdValid = true;
    }
    if (cmd === "build") {
      PgTerminal.setTerminalState(TerminalAction.buildStart);
      isCmdValid = true;
    }
    if (cmd === "deploy") {
      if (PgWallet.checkIsPgConnected())
        PgTerminal.setTerminalState(TerminalAction.deployStart);

      isCmdValid = true;
    }
    if (cmd === "clear") {
      // Move first line to the top
      this.pgTty.clearTty();
      // Clear everything
      this.pgTty.xterm.clear();
      this.prompt();
      isCmdValid = true;
    }
    if (cmd === "connect") {
      PgTerminal.setTerminalState(TerminalAction.walletConnectOrSetupStart);
      isCmdValid = true;
    }

    // This guarantees command only start with the specified command name
    // solana-keygen would not count for cmdName === "solana"
    const cmdName = cmd.split(" ")?.at(0);

    if (cmdName === "solana") {
      const wasm = this._wasm;
      if (PgWallet.checkIsPgConnected()) {
        if (wasm?.runSolana) {
          // @ts-ignore
          wasm.runSolana(cmd, ...PgTerminal.getCliArgs(WasmPkg.SOLANA_CLI));
        } else {
          PgTerminal.loadWasm(WasmPkg.SOLANA_CLI);
        }
      }

      isCmdValid = true;
    }
    if (cmdName === "spl-token") {
      const wasm = this._wasm;
      if (PgWallet.checkIsPgConnected()) {
        if (wasm?.runSplToken) {
          wasm.runSplToken(
            cmd,
            // @ts-ignore
            ...PgTerminal.getCliArgs(WasmPkg.SPL_TOKEN_CLI)
          );
        } else {
          PgTerminal.loadWasm(WasmPkg.SPL_TOKEN_CLI);
        }
      }

      isCmdValid = true;
    }

    // Special commands
    if (cmd === "!!") {
      // Run the last command
      const entries = this.history.entries;
      if (!entries.length) {
        this.pgTty.println("No previous command.");
        this.enable();
      } else {
        const lastCmd = entries[entries.length - 1];
        this._parseCommand(lastCmd);
      }

      isCmdValid = true;
    }

    // Only new prompt after invalid command, other commands will automatically
    // generate new prompt
    if (!isCmdValid) {
      if (cmd) {
        this.pgTty.println(`Command '${PgTerminal.italic(cmd)}' not found.\n`);
      }

      this.enable();
    }
  }

  setWasm(wasm: Wasm) {
    this._wasm = wasm;
  }

  /**
   * Enable shell:
   *
   * - Prompt
   * - Enable history
   */
  enable() {
    setTimeout(() => {
      this._active = true;
      this.prompt();
      this.pgTty.read(""); // Enables history
    }, 10);
  }

  /**
   * Prompt terminal
   *
   * This function also helps with command history
   */
  async prompt() {
    // If we are already prompting, do nothing
    if (this._activePrompt && this.pgTty.getInputStartsWithPrompt()) {
      return;
    }

    try {
      this._activePrompt = this.pgTty.read(PgTerminal.PROMPT);
      this._active = true;
      let line = await this._activePrompt.promise;

      if (line === "") {
        this.prompt();
        return;
      }

      if (this.history) {
        const input = this.pgTty.getInput().trim();
        this.history.push(input);
      }
    } catch (e: any) {
      this.pgTty.println(e.message);

      this.prompt();
    }
  }

  isPrompting() {
    return this._active;
  }

  /**
   * This function completes the current input, calls the given callback
   * and then re-displays the prompt.
   */
  printAndRestartPrompt(callback: () => Promise<any> | undefined) {
    // Complete input
    this.pgTty.setCursor(this.pgTty.getInput().length);
    this.pgTty.print("\r\n");

    // Prepare a function that will resume prompt
    const resume = () => {
      this.pgTty.setCursor(this.pgTty.getCursor());
      this.pgTty.setInput(this.pgTty.getInput());
    };

    // Call the given callback to echo something, and if there is a promise
    // returned, wait for the resolution before resuming prompt.
    const ret = callback();
    if (ret) {
      ret.then(resume);
    } else {
      resume();
    }
  }

  /**
   * Move cursor at given direction
   */
  handleCursorMove = (dir: number) => {
    if (dir > 0) {
      const num = Math.min(
        dir,
        this.pgTty.getInput().length - this.pgTty.getCursor()
      );
      this.pgTty.setCursorDirectly(this.pgTty.getCursor() + num);
    } else if (dir < 0) {
      const num = Math.max(dir, -this.pgTty.getCursor());
      this.pgTty.setCursorDirectly(this.pgTty.getCursor() + num);
    }
  };

  /**
   * Erase a character at cursor location
   */
  handleCursorErase = (backspace: boolean) => {
    if (backspace) {
      if (this.pgTty.getCursor() <= 0) return;
      const newInput =
        this.pgTty.getInput().substring(0, this.pgTty.getCursor() - 1) +
        this.pgTty.getInput().substring(this.pgTty.getCursor());
      this.pgTty.clearInput();
      this.pgTty.setCursorDirectly(this.pgTty.getCursor() - 1);
      this.pgTty.setInput(newInput, true);
    } else {
      const newInput =
        this.pgTty.getInput().substring(0, this.pgTty.getCursor()) +
        this.pgTty.getInput().substring(this.pgTty.getCursor() + 1);
      this.pgTty.setInput(newInput);
    }
  };

  /**
   * Insert character at cursor location
   */
  handleCursorInsert = (data: string) => {
    const newInput =
      this.pgTty.getInput().substring(0, this.pgTty.getCursor()) +
      data +
      this.pgTty.getInput().substring(this.pgTty.getCursor());
    this.pgTty.setCursorDirectly(this.pgTty.getCursor() + data.length);
    this.pgTty.setInput(newInput);
  };

  /**
   * @param clearCmd whether to clean the current line before parsing the command
   *
   * Handle input completion
   */
  handleReadComplete = (clearCmd?: boolean) => {
    const input = this.pgTty.getInput();
    if (this._activePrompt && this._activePrompt.resolve) {
      this._activePrompt.resolve(input);
      this._activePrompt = undefined;
    }

    if (clearCmd) this.pgTty.clearCurrentLine();
    else this.pgTty.print("\r\n");

    this._active = false;

    this._parseCommand(input);
  };

  /**
   * Handle terminal -> tty input
   */
  handleTermData = (data: string) => {
    // Only Allow CTRL+C Through
    if (!this._active && data !== "\x03") {
      return;
    }

    if (this.pgTty.getFirstInit() && this._activePrompt) {
      const line = this.pgTty
        .getBuffer()
        .getLine(this.pgTty.getBuffer().cursorY + this.pgTty.getBuffer().baseY);
      if (!line) return;

      const promptRead = line.translateToString(
        false,
        0,
        this.pgTty.getBuffer().cursorX
      );
      this._activePrompt.promptPrefix = promptRead;
      this.pgTty.setPromptPrefix(promptRead);
      this.pgTty.setFirstInit(false);
    }

    // If we have an active character prompt, satisfy it in priority
    if (this._activeCharPrompt && this._activeCharPrompt.resolve) {
      this._activeCharPrompt.resolve(data);
      this._activeCharPrompt = undefined;
      this.pgTty.print("\r\n");
      return;
    }

    // If this looks like a pasted input, expand it
    if (data.length > 3 && data.charCodeAt(0) !== 0x1b) {
      const normData = data.replace(/[\r\n]+/g, "\r");
      Array.from(normData).forEach((c) => this.handleData(c));
    } else {
      this.handleData(data);
    }
  };

  /**
   * Handle a single piece of information from the terminal -> tty.
   */
  handleData = (data: string) => {
    // Only Allow CTRL+C Through
    if (!this._active && data !== "\x03") {
      return;
    }

    const ord = data.charCodeAt(0);
    let ofs;

    // Handle ANSI escape sequences
    if (ord === 0x1b) {
      switch (data.substring(1)) {
        case "[A": // Up arrow
          if (this.history) {
            let value = this.history.getPrevious();
            if (value) {
              this.pgTty.setInput(value);
              this.pgTty.setCursor(value.length);
            }
          }
          break;

        case "[B": // Down arrow
          if (this.history) {
            let value = this.history.getNext();
            if (!value) value = "";
            this.pgTty.setInput(value);
            this.pgTty.setCursor(value.length);
          }
          break;

        case "[D": // Left Arrow
          this.handleCursorMove(-1);
          break;

        case "[C": // Right Arrow
          this.handleCursorMove(1);
          break;

        case "[3~": // Delete
          this.handleCursorErase(false);
          break;

        case "[F": // End
          this.pgTty.setCursor(this.pgTty.getInput().length);
          break;

        case "[H": // Home
          this.pgTty.setCursor(0);
          break;

        case "b": // ALT + LEFT
          ofs = closestLeftBoundary(
            this.pgTty.getInput(),
            this.pgTty.getCursor()
          );
          if (ofs) this.pgTty.setCursor(ofs);
          break;

        case "f": // ALT + RIGHT
          ofs = closestRightBoundary(
            this.pgTty.getInput(),
            this.pgTty.getCursor()
          );
          if (ofs) this.pgTty.setCursor(ofs);
          break;

        case "\x7F": // CTRL + BACKSPACE
          ofs = closestLeftBoundary(
            this.pgTty.getInput(),
            this.pgTty.getCursor()
          );
          if (ofs) {
            this.pgTty.setInput(
              this.pgTty.getInput().substring(0, ofs) +
                this.pgTty.getInput().substring(this.pgTty.getCursor())
            );
            this.pgTty.setCursor(ofs);
          }
          break;
      }
    }
    // Handle special characters
    else if (ord < 32 || ord === 0x7f) {
      switch (data) {
        case "\r": // ENTER
          if (isIncompleteInput(this.pgTty.getInput())) {
            this.handleCursorInsert("\n");
          } else {
            this.handleReadComplete();
          }
          break;

        case "\x7F": // BACKSPACE
        case "\x08": // CTRL+H
        case "\x04": // CTRL+D
          this.handleCursorErase(true);
          break;

        case "\t": // TAB
          if (this._autocompleteHandlers.length > 0) {
            const inputFragment = this.pgTty
              .getInput()
              .substring(0, this.pgTty.getCursor());
            const hasTrailingSpace = hasTrailingWhitespace(inputFragment);
            const candidates = collectAutocompleteCandidates(
              this._autocompleteHandlers,
              inputFragment
            );

            // Sort candidates
            candidates.sort();

            // Depending on the number of candidates, we are handing them in
            // a different way.
            if (candidates.length === 0) {
              // No candidates? Just add a space if there is none already
              if (!hasTrailingSpace) {
                this.handleCursorInsert(" ");
              }
            } else if (candidates.length === 1) {
              // Set the input
              this.pgTty.setInput(candidates[0]);

              // Move the cursor to the end
              this.pgTty.setCursor(candidates[0].length);
            } else if (candidates.length <= this.maxAutocompleteEntries) {
              // If we are less than maximum auto-complete candidates, print
              // them to the user and re-start prompt
              this.printAndRestartPrompt(() => {
                this.pgTty.printWide(candidates);
                return undefined;
              });
            } else {
              // If we have more than maximum auto-complete candidates, print
              // them only if the user acknowledges a warning
              this.printAndRestartPrompt(() =>
                this.pgTty
                  .readChar(
                    `Display all ${candidates.length} possibilities? (y or n)`
                  )
                  .promise.then((yn: string) => {
                    if (yn === "y" || yn === "Y") {
                      this.pgTty.printWide(candidates);
                    }
                  })
              );
            }
          } else {
            this.handleCursorInsert("    ");
          }
          break;

        case "\x01": // CTRL+A
          this.pgTty.setCursor(0);
          break;

        case "\x02": // CTRL+B
          this.handleCursorMove(-1);
          break;

        // TODO: implement stopping commands
        // case "\x03": // CTRL+C

        case "\x05": // CTRL+E
          this.pgTty.setCursor(this.pgTty.getInput().length);
          break;

        case "\x06": // CTRL+F
          this.handleCursorMove(1);
          break;

        case "\x07": // CTRL+G
          if (this.history) this.history.rewind();
          this.pgTty.setInput("");
          break;

        case "\x0b": // CTRL+K
          this.pgTty.setInput(
            this.pgTty.getInput().substring(0, this.pgTty.getCursor())
          );
          this.pgTty.setCursor(this.pgTty.getInput().length);
          break;

        case "\x0e": // CTRL+N
          if (this.history) {
            let value = this.history.getNext();
            if (!value) value = "";
            this.pgTty.setInput(value);
            this.pgTty.setCursor(value.length);
          }
          break;

        case "\x10": // CTRL+P
          if (this.history) {
            let value = this.history.getPrevious();
            if (value) {
              this.pgTty.setInput(value);
              this.pgTty.setCursor(value.length);
            }
          }
          break;

        case "\x15": // CTRL+U
          this.pgTty.setInput(
            this.pgTty.getInput().substring(this.pgTty.getCursor())
          );
          this.pgTty.setCursor(0);
          break;
      }

      // Handle visible characters
    } else {
      this.handleCursorInsert(data);
    }
  };
}
