import { PgTty } from "./tty";
import { PgShellHistory } from "./shell-history";
import {
  closestLeftBoundary,
  closestRightBoundary,
  collectAutocompleteCandidates,
  hasTrailingWhitespace,
  isIncompleteInput,
} from "./shell-utils";
import { PgTerminal } from "./terminal";
import { PgCommon } from "../common";
import { EventName } from "../../../constants";
import type {
  ActiveCharPrompt,
  ActivePrompt,
  AutoCompleteHandler,
  ExecuteCommand,
} from "./types";

type ShellOptions = { historySize: number; maxAutocompleteEntries: number };

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
  private _execute: ExecuteCommand;
  private _active = false;
  private _waitingForInput = false;
  private _processCount = 0;
  private _activePrompt: ActivePrompt | null = null;
  private _activeCharPrompt: ActiveCharPrompt | null = null;
  private _history: PgShellHistory;
  private _maxAutocompleteEntries: number;
  private _autocompleteHandlers: AutoCompleteHandler[];

  constructor(
    tty: PgTty,
    execute: ExecuteCommand,
    options: ShellOptions = {
      historySize: 30,
      maxAutocompleteEntries: 100,
    }
  ) {
    this._tty = tty;
    this._execute = execute;

    this._history = new PgShellHistory(options.historySize);
    this._maxAutocompleteEntries = options.maxAutocompleteEntries;
    this._autocompleteHandlers = [() => this._history.getEntries()];
  }

  /**
   * @returns terminal history
   */
  getHistory() {
    return this._history;
  }

  /** Disable shell. */
  disable() {
    this._incrementProcessCount();
    this._active = false;
  }

  /** Enable shell. */
  enable() {
    setTimeout(() => {
      this._decrementProcessCount();
      this._active = true;
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
      this._active = true;

      if (this._history) {
        await this._activePrompt.promise;
        const input = this._tty.getInput().trim();
        this._history.push(input);
      }
    } catch (e: any) {
      this._tty.println(e.message);
      this.prompt();
    }
  }

  /** Get whether the shell is active. */
  isPrompting() {
    return this._active;
  }

  /**
   * Complete the current input, call the given callback and then re-display
   * the old prompt.
   */
  printAndRestartPrompt(cb: () => Promise<any> | void) {
    // Complete input
    this._tty.setCursor(this._tty.getInput().length);
    this._tty.print("\r\n");

    // Prepare a function that will resume prompt
    const resume = () => {
      this._tty.setCursor(this._tty.getCursor());
      this._tty.setInput(this._tty.getInput());
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
  async waitForUserInput(msg: string): Promise<string> {
    return new Promise((res, rej) => {
      if (this._waitingForInput) rej("Already waiting for input.");
      else {
        this._waitingForInput = true;
        this._tty.clearLine();
        this._tty.println(
          PgTerminal.secondary(PgTerminal.WAITING_INPUT_MSG_PREFIX) + msg
        );
        this.enable();

        // This will happen once user sends the input
        const handleInput = () => {
          document.removeEventListener(
            EventName.TERMINAL_WAIT_FOR_INPUT,
            handleInput
          );
          this._waitingForInput = false;
          const input = this._tty.getInput();
          res(input);
        };

        document.addEventListener(
          EventName.TERMINAL_WAIT_FOR_INPUT,
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
    const input = this._tty.getInput();
    if (this._activePrompt && this._activePrompt.resolve) {
      this._activePrompt.resolve(input);
      this._activePrompt = null;
    }

    if (clearCmd) this._tty.clearLine();
    else this._tty.print("\r\n");

    this._active = false;

    if (this._waitingForInput) {
      PgCommon.createAndDispatchCustomEvent(EventName.TERMINAL_WAIT_FOR_INPUT);
    } else {
      return await this._execute(input);
    }
  }

  /** Handle terminal -> tty input. */
  handleTermData = (data: string) => {
    // Only Allow CTRL+C through
    if (!this._active && data !== "\x03") {
      return;
    }

    if (this._tty.getFirstInit() && this._activePrompt) {
      const line = this._tty
        .getBuffer()
        .getLine(this._tty.getBuffer().cursorY + this._tty.getBuffer().baseY);
      if (!line) return;

      const promptRead = line.translateToString(
        false,
        0,
        this._tty.getBuffer().cursorX
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
      const num = Math.min(
        dir,
        this._tty.getInput().length - this._tty.getCursor()
      );
      this._tty.setCursorDirectly(this._tty.getCursor() + num);
    } else if (dir < 0) {
      const num = Math.max(dir, -this._tty.getCursor());
      this._tty.setCursorDirectly(this._tty.getCursor() + num);
    }
  };

  /** Insert character at cursor location. */
  private _handleCursorInsert = (data: string) => {
    const newInput =
      this._tty.getInput().substring(0, this._tty.getCursor()) +
      data +
      this._tty.getInput().substring(this._tty.getCursor());
    this._tty.setCursorDirectly(this._tty.getCursor() + data.length);
    this._tty.setInput(newInput);
  };

  /** Erase a character at cursor location. */
  private _handleCursorErase = (backspace: boolean) => {
    if (backspace) {
      if (this._tty.getCursor() <= 0) return;

      const newInput =
        this._tty.getInput().substring(0, this._tty.getCursor() - 1) +
        this._tty.getInput().substring(this._tty.getCursor());
      this._tty.clearInput();
      this._tty.setCursorDirectly(this._tty.getCursor() - 1);
      this._tty.setInput(newInput, true);
    } else {
      const newInput =
        this._tty.getInput().substring(0, this._tty.getCursor()) +
        this._tty.getInput().substring(this._tty.getCursor() + 1);
      this._tty.setInput(newInput);
    }
  };

  /** Handle a single piece of information from the terminal -> tty. */
  private _handleData = (data: string) => {
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
          if (this._history) {
            let value = this._history.getPrevious();
            if (value) {
              this._tty.setInput(value);
              this._tty.setCursor(value.length);
            }
          }
          break;

        case "[B": // Down arrow
          if (this._history) {
            let value = this._history.getNext();
            if (!value) value = "";
            this._tty.setInput(value);
            this._tty.setCursor(value.length);
          }
          break;

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
          this._tty.setCursor(this._tty.getInput().length);
          break;

        case "[H": // Home
          this._tty.setCursor(0);
          break;

        case "b": // ALT + LEFT
          ofs = closestLeftBoundary(
            this._tty.getInput(),
            this._tty.getCursor()
          );
          if (ofs) this._tty.setCursor(ofs);
          break;

        case "f": // ALT + RIGHT
          ofs = closestRightBoundary(
            this._tty.getInput(),
            this._tty.getCursor()
          );
          if (ofs) this._tty.setCursor(ofs);
          break;

        case "\x7F": // CTRL + BACKSPACE
          ofs = closestLeftBoundary(
            this._tty.getInput(),
            this._tty.getCursor()
          );
          if (ofs) {
            this._tty.setInput(
              this._tty.getInput().substring(0, ofs) +
                this._tty.getInput().substring(this._tty.getCursor())
            );
            this._tty.setCursor(ofs);
          }
          break;
      }
    }
    // Handle special characters
    else if (ord < 32 || ord === 0x7f) {
      switch (data) {
        case "\r": // ENTER
          if (isIncompleteInput(this._tty.getInput())) {
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
          if (this._autocompleteHandlers.length > 0) {
            const inputFragment = this._tty
              .getInput()
              .substring(0, this._tty.getCursor());
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
                this._handleCursorInsert(" ");
              }
            } else if (candidates.length === 1) {
              // Set the input
              this._tty.setInput(candidates[0]);

              // Move the cursor to the end
              this._tty.setCursor(candidates[0].length);
            } else if (candidates.length <= this._maxAutocompleteEntries) {
              // If we are less than maximum auto-complete candidates, print
              // them to the user and re-start prompt
              this.printAndRestartPrompt(() => {
                this._tty.printWide(candidates);
              });
            } else {
              // If we have more than maximum auto-complete candidates, print
              // them only if the user acknowledges a warning
              this.printAndRestartPrompt(() =>
                this._tty
                  .readChar(
                    `Display all ${candidates.length} possibilities? (y or n)`
                  )
                  .promise.then((yn: string) => {
                    if (yn === "y" || yn === "Y") {
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
          this._tty.setCursor(this._tty.getInput().length);
          break;

        case "\x06": // CTRL+F
          this._handleCursorMove(1);
          break;

        case "\x07": // CTRL+G
          if (this._history) this._history.getPrevious();
          this._tty.setInput("");
          break;

        case "\x0b": // CTRL+K
          this._tty.setInput(
            this._tty.getInput().substring(0, this._tty.getCursor())
          );
          this._tty.setCursor(this._tty.getInput().length);
          break;

        case "\x0e": // CTRL+N
          if (this._history) {
            let value = this._history.getNext();
            if (!value) value = "";
            this._tty.setInput(value);
            this._tty.setCursor(value.length);
          }
          break;

        case "\x10": // CTRL+P
          if (this._history) {
            let value = this._history.getPrevious();
            if (value) {
              this._tty.setInput(value);
              this._tty.setCursor(value.length);
            }
          }
          break;

        case "\x15": // CTRL+U
          this._tty.setInput(
            this._tty.getInput().substring(this._tty.getCursor())
          );
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
    if (this._processCount) {
      this._processCount--;
    }
  }
}
