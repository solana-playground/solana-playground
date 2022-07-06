import { IBufferLine } from "xterm";

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
import { PgTerminal } from "./terminal";
import { Wasm } from "../../../components/Panels/Main/Terminal/useWasm";

type AutoCompleteHandler = (index: number, tokens: string[]) => string[];

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
    options: { historySize: number; maxAutocompleteEntries: number } = {
      historySize: 10,
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

  setWasm(wasm: Wasm) {
    this._wasm = wasm;
  }

  /**
   * Prompt terminal
   *
   * This function also helps with command history
   */
  async prompt() {
    // If we are already prompting, do nothing
    if (this._activePrompt && this.pgTty.getCurrentLineStartsWithPrompt()) {
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

      if (line === "!!") {
        // This means run the previous command
        if (this.history && this.history.entries.length > 0) {
          line = this.history.entries[this.history.entries.length - 1];
        } else {
          throw new Error("No Previous command in History");
        }
      } else if (this.history) {
        const input = this.pgTty.getInput().trim();
        // Only put input into history if it's unique
        if (!this.history.includes(input)) this.history.push(input);
      }
    } catch (e: any) {
      this.pgTty.println(`${e.toString()}`);

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
   * Handle input completion
   */
  handleReadComplete = () => {
    if (this._activePrompt && this._activePrompt.resolve) {
      this._activePrompt.resolve(this.pgTty.getInput());
      this._activePrompt = undefined;
    }
    this.pgTty.print("\r\n");
    this._active = false;

    const input = this.pgTty.getInput();
    const isCmdValid = PgTerminal.parseCommand(input, this._wasm);

    // Only new prompt after invalid command, other commands will automatically
    // generate new prompt
    if (!isCmdValid) {
      if (input) {
        this.pgTty.print(
          `Command '${PgTerminal.italic(input.trim())}' not found.\n\n`
        );
      }

      PgTerminal.enable();
    }
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
      let line = this.pgTty
        .getBuffer()
        .getLine(this.pgTty.getBuffer().cursorY + this.pgTty.getBuffer().baseY);
      let promptRead = (line as IBufferLine).translateToString(
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

      // Handle special characters
    } else if (ord < 32 || ord === 0x7f) {
      switch (data) {
        case "\r": // ENTER
        case "\x0a": // CTRL+J
        case "\x0d": // CTRL+M
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
                console.log(candidates);
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

        case "\x0c": // CTRL+L
          this.pgTty.clearTty();
          this.pgTty.print(`${PgTerminal.PROMPT}${this.pgTty.getInput()}`);
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
