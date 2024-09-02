import { PgAutocomplete } from "./autocomplete";
import { PgHistory } from "./history";
import { PgTty } from "./tty";
import {
  closestLeftBoundary,
  closestRightBoundary,
  hasTrailingWhitespace,
  isIncompleteInput,
  parse,
} from "./utils";
import { PgTerminal } from "./terminal";
import { PgCommon } from "../common";

import type { ActiveCharPrompt, ActivePrompt, CommandManager } from "./types";

/**
 * A shell is the primary interface that is used to start other programs.
 *
 * Its purpose is to handle:
 * - Job control (control of child processes),
 * - Line editing and history
 * - Output text to the tty -> terminal
 * - Interpret text within the tty to launch processes and interpret programs
 */
export class PgShell {
  private _tty: PgTty;
  private _cmdManager: CommandManager;
  private _autocomplete: PgAutocomplete;
  private _history: PgHistory;
  private _waitingForInput = false;
  private _processCount = 0;
  private _activePrompt: ActivePrompt | null = null;
  private _activeCharPrompt: ActiveCharPrompt | null = null;

  constructor(
    tty: PgTty,
    cmdManager: CommandManager,
    autocomplete: PgAutocomplete,
    history: PgHistory
  ) {
    this._tty = tty;
    this._cmdManager = cmdManager;
    this._autocomplete = autocomplete;
    this._history = history;
  }

  /** Terminal history */
  get history() {
    return this._history;
  }

  /** Disable shell. */
  disable() {
    this._incrementProcessCount();
  }

  /** Enable shell. */
  enable() {
    setTimeout(() => {
      this._decrementProcessCount();
      if (!this._processCount) this.prompt();
    }, 10);
  }

  /**
   * Prompt terminal.
   *
   * This function also helps with command history.
   */
  async prompt() {
    // If we are already prompting, do nothing
    if (this._activePrompt && this._tty.getInputStartsWithPrompt()) {
      return;
    }

    try {
      const promptText = this._waitingForInput
        ? PgTerminal.WAITING_INPUT_PROMPT_PREFIX
        : PgTerminal.PROMPT_PREFIX;
      this._activePrompt = this._tty.read(promptText);

      await this._activePrompt.promise;
      const input = this._tty.input.trim();
      this._history.push(input);
    } catch (e: any) {
      this._tty.println(e.message);
      this.prompt();
    }
  }

  /** Get whether the shell is active, and the user can type. */
  isPrompting() {
    return !this._processCount || this._waitingForInput;
  }

  /**
   * Complete the current input, call the given callback and then re-display
   * the old prompt.
   */
  printAndRestartPrompt(cb: () => Promise<any> | void) {
    // Complete input
    this._tty.setCursor(this._tty.input.length);
    this._tty.print("\r\n");

    // Prepare a function that will resume prompt
    const resume = () => {
      this._tty.setCursor(this._tty.cursor);
      this._tty.setInput(this._tty.input);
    };

    // Call the given callback to echo something, and if there is a promise
    // returned, wait for the resolution before resuming prompt.
    const ret = cb();
    if (ret) {
      ret.then(resume);
    } else {
      resume();
    }
  }

  /**
   * Wait for user input.
   *
   * @param msg message to print to the terminal before prompting user
   * @returns user input
   */
  async waitForUserInput(msg: string) {
    return new Promise<string>((res, rej) => {
      if (this._waitingForInput) rej("Already waiting for input.");
      else {
        this._tty.clearLine();
        this._tty.println(
          PgTerminal.secondary(PgTerminal.WAITING_INPUT_MSG_PREFIX) + msg
        );
        this._waitingForInput = true;
        this.prompt();

        // This will happen once user sends the input
        const handleInput = () => {
          document.removeEventListener(
            PgShell._TERMINAL_WAIT_FOR_INPUT,
            handleInput
          );
          this._waitingForInput = false;
          res(this._tty.input);
        };

        document.addEventListener(
          PgShell._TERMINAL_WAIT_FOR_INPUT,
          handleInput
        );
      }
    });
  }

  /**
   * Handle input completion.
   *
   * @param clearCmd whether to clean the current line before parsing the command
   */
  async handleReadComplete(clearCmd?: boolean) {
    const input = this._tty.input;
    if (this._activePrompt && this._activePrompt.resolve) {
      this._activePrompt.resolve(input);
      this._activePrompt = null;
    }

    if (clearCmd) this._tty.clearLine();
    else this._tty.print("\r\n");

    if (this._waitingForInput) {
      PgCommon.createAndDispatchCustomEvent(PgShell._TERMINAL_WAIT_FOR_INPUT);
    } else {
      const parsedInput = parse(input).flatMap((token) =>
        token === "!!" ? parse(this._history.getPrevious() ?? "") : [token]
      );
      return await this._cmdManager.execute(parsedInput);
    }
  }

  /** Handle terminal -> tty input. */
  handleTermData = (data: string) => {
    // Only Allow CTRL+C through
    if (!this.isPrompting() && data !== "\x03") return;

    if (this._tty.firstInit && this._activePrompt) {
      const line = this._tty.buffer.getLine(
        this._tty.buffer.cursorY + this._tty.buffer.baseY
      );
      if (!line) return;

      const promptRead = line.translateToString(
        false,
        0,
        this._tty.buffer.cursorX
      );
      this._activePrompt.promptPrefix = promptRead;
      this._tty.setPromptPrefix(promptRead);
      this._tty.setFirstInit(false);
    }

    // If we have an active character prompt, satisfy it in priority
    if (this._activeCharPrompt && this._activeCharPrompt.resolve) {
      this._activeCharPrompt.resolve(data);
      this._activeCharPrompt = null;
      this._tty.print("\r\n");
      return;
    }

    // If this looks like a pasted input, expand it
    if (data.length > 3 && data.charCodeAt(0) !== 0x1b) {
      const normData = data.replace(/[\r\n]+/g, "\r");
      Array.from(normData).forEach((c) => this._handleData(c));
    } else {
      this._handleData(data);
    }
  };

  /** Move cursor at given direction. */
  private _handleCursorMove = (dir: number) => {
    if (dir > 0) {
      const num = Math.min(dir, this._tty.input.length - this._tty.cursor);
      this._tty.setCursorDirectly(this._tty.cursor + num);
    } else if (dir < 0) {
      const num = Math.max(dir, -this._tty.cursor);
      this._tty.setCursorDirectly(this._tty.cursor + num);
    }
  };

  /** Insert character at cursor location. */
  private _handleCursorInsert = (data: string) => {
    const newInput =
      this._tty.input.substring(0, this._tty.cursor) +
      data +
      this._tty.input.substring(this._tty.cursor);
    this._tty.setCursorDirectly(this._tty.cursor + data.length);
    this._tty.setInput(newInput);
  };

  /** Erase a character at cursor location. */
  private _handleCursorErase = (backspace: boolean) => {
    if (backspace) {
      if (this._tty.cursor <= 0) return;

      const newInput =
        this._tty.input.substring(0, this._tty.cursor - 1) +
        this._tty.input.substring(this._tty.cursor);
      this._tty.clearInput();
      this._tty.setCursorDirectly(this._tty.cursor - 1);
      this._tty.setInput(newInput, true);
    } else {
      const newInput =
        this._tty.input.substring(0, this._tty.cursor) +
        this._tty.input.substring(this._tty.cursor + 1);
      this._tty.setInput(newInput);
    }
  };

  /** Handle a single piece of information from the terminal -> tty. */
  private _handleData = (data: string) => {
    // Only Allow CTRL+C Through
    if (!this.isPrompting() && data !== "\x03") return;

    const ord = data.charCodeAt(0);

    // Handle ANSI escape sequences
    if (ord === 0x1b) {
      switch (data.substring(1)) {
        case "[A": {
          // Up arrow
          const value = this._history.getPrevious();
          if (value) {
            this._tty.setInput(value);
            this._tty.setCursor(value.length);
          }
          break;
        }

        case "[B": {
          // Down arrow
          const value = this._history.getNext() ?? "";
          this._tty.setInput(value);
          this._tty.setCursor(value.length);
          break;
        }

        case "[D": // Left Arrow
          this._handleCursorMove(-1);
          break;

        case "[C": // Right Arrow
          this._handleCursorMove(1);
          break;

        case "[3~": // Delete
          this._handleCursorErase(false);
          break;

        case "[F": // End
          this._tty.setCursor(this._tty.input.length);
          break;

        case "[H": // Home
          this._tty.setCursor(0);
          break;

        case "b": {
          // ALT + LEFT
          const offset = closestLeftBoundary(this._tty.input, this._tty.cursor);
          this._tty.setCursor(offset);
          break;
        }

        case "f": {
          // ALT + RIGHT
          const offset = closestRightBoundary(
            this._tty.input,
            this._tty.cursor
          );
          this._tty.setCursor(offset);
          break;
        }

        case "\x7F": {
          // CTRL + BACKSPACE
          const offset = closestLeftBoundary(this._tty.input, this._tty.cursor);
          this._tty.setInput(
            this._tty.input.substring(0, offset) +
              this._tty.input.substring(this._tty.cursor)
          );
          this._tty.setCursor(offset);

          break;
        }
      }
    }
    // Handle special characters
    else if (ord < 32 || ord === 0x7f) {
      switch (data) {
        case "\r": // ENTER
          if (isIncompleteInput(this._tty.input)) {
            this._handleCursorInsert("\n");
          } else {
            this.handleReadComplete();
          }
          break;

        case "\x7F": // BACKSPACE
        case "\x08": // CTRL+H
        case "\x04": // CTRL+D
          this._handleCursorErase(true);
          break;

        case "\t": // TAB
          if (this._autocomplete.hasAnyHandler()) {
            const inputFragment = this._tty.input.substring(
              0,
              this._tty.cursor
            );

            const createNewInput = (candidate: string) => {
              const tokens = parse(inputFragment);
              return [
                ...(hasTrailingWhitespace(inputFragment)
                  ? tokens
                  : tokens.slice(0, -1)),
                candidate,
              ]
                .map((token) => (token.includes(" ") ? `"${token}"` : token))
                .join(" ");
            };

            const candidates = this._autocomplete.getCandidates(inputFragment);

            // Depending on the number of candidates, we are handing them in a
            // different way.
            if (candidates.length === 0) {
              // Add a space if there is none already
              if (!hasTrailingWhitespace(inputFragment)) {
                this._handleCursorInsert(" ");
              }
            } else if (candidates.length === 1) {
              // Set the input
              const newInput = createNewInput(candidates[0]);
              this._tty.setInput(newInput);
              this._tty.setCursor(newInput.length);
            } else if (candidates.length <= 100) {
              // If the candidate count is less than maximum auto-complete
              // candidates, find the common candidate
              let commonCandidate = "";
              for (let i = 0; i < candidates[0].length; i++) {
                const char = candidates[0][i];
                const matches = candidates.every((cand) => cand[i] === char);
                if (matches) commonCandidate += char;
                else break;
              }

              const newInput = createNewInput(commonCandidate);

              // If the input is already the common candidate, print all
              // candidates to the user and re-start prompt
              if (inputFragment === newInput) {
                this.printAndRestartPrompt(() => {
                  this._tty.printWide(candidates);
                });
              } else {
                // Set the input to the common candidate
                this._tty.setInput(newInput);
                this._tty.setCursor(newInput.length);
              }
            } else {
              // If we have more than maximum auto-complete candidates, print
              // them only if the user acknowledges a warning
              this.printAndRestartPrompt(() =>
                this._tty
                  .readChar(
                    `Display all ${candidates.length} possibilities? (y or n)`
                  )
                  .promise.then((answer: string) => {
                    if (answer.toLowerCase() === "y") {
                      this._tty.printWide(candidates);
                    }
                  })
              );
            }
          } else {
            this._handleCursorInsert("    ");
          }
          break;

        case "\x01": // CTRL+A
          this._tty.setCursor(0);
          break;

        case "\x02": // CTRL+B
          this._handleCursorMove(-1);
          break;

        // TODO: implement stopping commands
        // case "\x03": // CTRL+C

        case "\x05": // CTRL+E
          this._tty.setCursor(this._tty.input.length);
          break;

        case "\x06": // CTRL+F
          this._handleCursorMove(1);
          break;

        case "\x07": // CTRL+G
          this._history.getPrevious();
          this._tty.setInput("");
          break;

        case "\x0b": // CTRL+K
          this._tty.setInput(this._tty.input.substring(0, this._tty.cursor));
          this._tty.setCursor(this._tty.input.length);
          break;

        case "\x0e": {
          // CTRL+N
          const value = this._history.getNext() ?? "";
          this._tty.setInput(value);
          this._tty.setCursor(value.length);
          break;
        }

        case "\x10": {
          // CTRL+P
          const value = this._history.getPrevious();
          if (value) {
            this._tty.setInput(value);
            this._tty.setCursor(value.length);
          }
          break;
        }

        case "\x15": // CTRL+U
          this._tty.setInput(this._tty.input.substring(this._tty.cursor));
          this._tty.setCursor(0);
          break;
      }

      // Handle visible characters
    } else {
      this._handleCursorInsert(data);
    }
  };

  /** Increment active process count. */
  private _incrementProcessCount() {
    this._processCount++;
  }

  /** Decrement active process count if process count is greater than 0. */
  private _decrementProcessCount() {
    if (this._processCount) this._processCount--;
  }

  /** Event name of terminal input wait */
  private static readonly _TERMINAL_WAIT_FOR_INPUT = "terminalwaitforinput";
}
