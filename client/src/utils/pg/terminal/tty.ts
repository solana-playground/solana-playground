import { Terminal as XTerm } from "xterm";

import { countLines, offsetToColRow } from "./tty-utils";
import { PgTerminal } from "./terminal";
import { PgCommon } from "../common";
import type { ActiveCharPrompt, ActivePrompt, PrintOptions } from "./types";

/**
 * TTY manages text I/O related things such as prompting, input parsing and
 * printing messages to the terminal.
 */
export class PgTty {
  private _xterm: XTerm;
  private _termSize: {
    cols: number;
    rows: number;
  };
  private _firstInit = true;
  private _promptPrefix = "";
  private _continuationPromptPrefix = "";
  private _cursor = 0;
  private _input = "";

  constructor(xterm: XTerm) {
    this._xterm = xterm;

    this._termSize = {
      cols: this._xterm.cols,
      rows: this._xterm.rows,
    };
  }

  /** Get whether it is the initial read. */
  getFirstInit() {
    return this._firstInit;
  }

  /** Get the current input in the line. */
  getInput() {
    return this._input;
  }

  /** Get the current cursor position. */
  getCursor() {
    return this._cursor;
  }

  /** Get the TTY size (columns and rows). */
  getSize() {
    return this._termSize;
  }

  /** Get the active terminal buffer. */
  getBuffer() {
    return this._xterm.buffer.active;
  }

  /**
   * Get current line as string.
   *
   * @param offset how many lines before the current line
   *
   * @returns the current line as string
   */
  getCurrentLineString(offset: number = 0) {
    return this._getCurrentLine(offset)?.translateToString();
  }

  /**
   * Get whether the current input starts with prompt.
   *
   * Useful for `PgTerm.fit()`.
   */
  getInputStartsWithPrompt() {
    for (let i = 0; i < 10; i++) {
      const currentLine = this._getCurrentLine(i);
      if (!currentLine) return;

      if (!currentLine.isWrapped) {
        const currentLineStr = currentLine.translateToString();
        return (
          currentLineStr.startsWith(PgTerminal.PROMPT_PREFIX) ||
          currentLineStr.startsWith(PgTerminal.CONTINUATION_PROMPT_PREFIX) ||
          currentLineStr.startsWith(PgTerminal.WAITING_INPUT_PROMPT_PREFIX)
        );
      }
    }
  }

  /**
   * Replace input with the new input given
   *
   * This function clears all the lines that the current input occupies and
   * then replaces them with the new input.
   */
  setInput(newInput: string, shouldNotClearInput: boolean = false) {
    if (!shouldNotClearInput) {
      this.clearInput();
    }

    // Write the new input lines, including the current prompt
    const newPrompt = this._applyPrompts(newInput);
    this.print(newPrompt);

    // Trim cursor overflow
    if (this._cursor > newInput.length) {
      this._cursor = newInput.length;
    }

    // Move the cursor to the appropriate row/col
    const newCursor = this._applyPromptOffset(newInput, this._cursor);
    const newLines = countLines(newPrompt, this._termSize.cols);
    const { col, row } = offsetToColRow(
      newPrompt,
      newCursor,
      this._termSize.cols
    );
    const moveUpRows = newLines - row - 1;

    this._xterm.write("\r");
    for (let i = 0; i < moveUpRows; ++i) this._xterm.write("\x1b[F");
    for (let i = 0; i < col; ++i) this._xterm.write("\x1b[C");

    // Replace input
    this._input = newInput;
  }

  /** Set the new cursor position, as an offset on the input string. */
  setCursor(newCursor: number) {
    if (newCursor < 0) newCursor = 0;
    if (newCursor > this._input.length) newCursor = this._input.length;
    this._writeCursorPosition(newCursor);
  }

  /** Set the direct cursor value. Should only be used in keystroke contexts. */
  setCursorDirectly(newCursor: number) {
    this._writeCursorPosition(newCursor);
  }

  /** Set the terminal TTY size. */
  setTermSize(cols: number, rows: number) {
    this._termSize = { cols, rows };
  }

  /** Set the first init. */
  setFirstInit(value: boolean) {
    this._firstInit = value;
  }

  /** Set the prompt prefix. */
  setPromptPrefix(value: string) {
    this._promptPrefix = value;
  }

  /**
   * Return a promise that will resolve when the user has completed typing a
   * single line.
   */
  read(
    promptPrefix: string,
    continuationPromptPrefix: string = PgTerminal.CONTINUATION_PROMPT_PREFIX
  ): ActivePrompt {
    if (promptPrefix.length > 0) {
      this.print(promptPrefix);
    }

    this._firstInit = true;
    this._promptPrefix = promptPrefix;
    this._continuationPromptPrefix = continuationPromptPrefix;
    this._input = "";
    this._cursor = 0;

    return {
      promptPrefix,
      continuationPromptPrefix,
      ...this._getAsyncRead(),
    };
  }

  /**
   * Return a promise that will be resolved when the user types a single
   * character.
   *
   * This can be active in addition to `.read()` and will be resolved in
   * priority before it.
   */
  readChar(promptPrefix: string): ActiveCharPrompt {
    if (promptPrefix.length > 0) {
      this.print(promptPrefix);
    }

    return {
      promptPrefix,
      ...this._getAsyncRead(),
    };
  }

  /** Print a message and properly handle new-lines. */
  print(msg: any, opts?: PrintOptions) {
    if (typeof msg === "object") msg = PgCommon.prettyJSON(msg);
    else msg = `${msg}`;

    // All data types should be converted to string
    msg = msg.replace(/[\r\n]+/g, "\n").replace(/\n/g, "\r\n");

    // Color text
    if (!opts?.noColor) msg = PgTty._highlightText(msg);
    if (opts?.newLine) msg += "\n";

    if (opts?.sync) {
      // We write it synchronously via hacking a bit on xterm

      //@ts-ignore
      this._xterm._core.writeSync(msg);
      //@ts-ignore
      this._xterm._core._renderService._renderer._runOperation((renderer) =>
        renderer.onGridChanged(0, this._xterm.rows - 1)
      );
    } else {
      this._xterm.write(msg);
    }
  }

  /** Print a message with an extra line appended. */
  println(msg: string, opts?: PrintOptions) {
    this.print(msg, { ...opts, newLine: true });
  }

  /** Print a list of items using a wide-format. */
  printWide(items: Array<string>, padding = 2) {
    if (items.length === 0) return this.println("");

    // Compute item sizes and matrix row/cols
    const itemWidth =
      items.reduce((width, item) => Math.max(width, item.length), 0) + padding;
    const wideCols = Math.floor(this._termSize.cols / itemWidth);
    const wideRows = Math.ceil(items.length / wideCols);

    // Print matrix
    let i = 0;
    for (let row = 0; row < wideRows; ++row) {
      let rowStr = "";

      // Prepare columns
      for (let col = 0; col < wideCols; ++col) {
        if (i < items.length) {
          let item = items[i++];
          item += " ".repeat(itemWidth - item.length);
          rowStr += item;
        }
      }
      this.println(rowStr);
    }
  }

  /**
   * Print a status message on the current line.
   *
   * This function meant to be used with `clearStatus()`.
   */
  printStatus(message: string, sync?: boolean) {
    // Save the cursor position
    this.print("\u001b[s", { sync });
    this.print(message, { sync });
  }

  /**
   * Clear the current status on the line.
   *
   * This function is meant to be run after `printStatus()`.
   */
  clearStatus(sync?: boolean) {
    // Restore the cursor position
    this.print("\u001b[u", { sync });
    // Clear from cursor to end of screen
    this.print("\u001b[1000D", { sync });
    this.print("\u001b[0J", { sync });
  }

  /**
   * Clear the current prompt.
   *
   * This function will erase all the lines that display the current prompt
   * and move the cursor in the beginning of the first line of the prompt.
   */
  clearInput() {
    const currentPrompt = this._applyPrompts(this._input);

    // Get the overall number of lines to clear
    const allRows = countLines(currentPrompt, this._termSize.cols);

    // Get the line we are currently in
    const promptCursor = this._applyPromptOffset(this._input, this._cursor);
    const { row } = offsetToColRow(
      currentPrompt,
      promptCursor,
      this._termSize.cols
    );

    // First move on the last line
    const moveRows = allRows - row - 1;
    for (let i = 0; i < moveRows; ++i) this._xterm.write("\x1b[E");

    // Clear current input line(s)
    this._xterm.write("\r\x1b[K");
    for (let i = 1; i < allRows; ++i) this._xterm.write("\x1b[F\x1b[K");
  }

  /** Clear the entire XTerm buffer. */
  clear() {
    this._xterm.clear();
  }

  /**
   * Clear the entire TTY.
   *
   * This function will erase all the lines that display on the tty,
   * and move the cursor in the beginning of the first line of the prompt.
   */
  clearTty() {
    // Clear the screen
    this._xterm.write("\x1b[2J");
    // Set the cursor to 0, 0
    this._xterm.write("\x1b[0;0H");
    // Scroll to bottom
    this._xterm.scrollToBottom();
  }

  /**
   * Clear the current line.
   *
   * @param offset amount of lines before the current line
   */
  clearLine(offset?: number) {
    if (offset) {
      // Move up
      this.print(`\x1b[${offset}A`);
    }

    // Clears the whole line
    this.print(`\x1b[G`);
    // This also clears the line but helps with parsing errors
    this.print(`\x1b[2K`);
  }

  /**
   * Change the specified line with the new input.
   *
   * @param newInput input to change the line to
   * @param offset line offset. 0 is current, 1 is last. Defaults to 1.
   */
  changeLine(newInput: string, offset: number = 1) {
    this.clearLine(offset);
    this.println(newInput);
  }

  /** Create a deconstructed read promise. */
  private _getAsyncRead() {
    let readResolve;
    let readReject;
    const readPromise = new Promise((resolve, reject) => {
      readResolve = (response: string) => {
        this._promptPrefix = "";
        this._continuationPromptPrefix = "";
        resolve(response);
      };
      readReject = reject;
    });

    return {
      promise: readPromise,
      resolve: readResolve,
      reject: readReject,
    };
  }

  /** Apply prompts to the given input. */
  private _applyPrompts(input: string): string {
    return (
      this._promptPrefix +
      input.replace(/\n/g, "\n" + this._continuationPromptPrefix)
    );
  }

  /** Get the current line. */
  private _getCurrentLine(offset: number = 0) {
    const buffer = this.getBuffer();
    return buffer.getLine(buffer.baseY + buffer.cursorY - offset);
  }

  /**
   * Advance the `offset` as required in order to accompany the prompt
   * additions to the input.
   */
  private _applyPromptOffset(input: string, offset: number): number {
    const newInput = this._applyPrompts(input.substring(0, offset));
    return newInput.length;
  }

  /** Write the new cursor position. */
  private _writeCursorPosition(newCursor: number) {
    // Apply prompt formatting to get the visual status of the display
    const inputWithPrompt = this._applyPrompts(this._input);
    // const inputLines = countLines(inputWithPrompt, this._termSize.cols);

    // Estimate previous cursor position
    const prevPromptOffset = this._applyPromptOffset(this._input, this._cursor);
    const { col: prevCol, row: prevRow } = offsetToColRow(
      inputWithPrompt,
      prevPromptOffset,
      this._termSize.cols
    );

    // Estimate next cursor position
    const newPromptOffset = this._applyPromptOffset(this._input, newCursor);
    const { col: newCol, row: newRow } = offsetToColRow(
      inputWithPrompt,
      newPromptOffset,
      this._termSize.cols
    );

    // Adjust vertically
    if (newRow > prevRow) {
      for (let i = prevRow; i < newRow; ++i) this._xterm.write("\x1b[B");
    } else {
      for (let i = newRow; i < prevRow; ++i) this._xterm.write("\x1b[A");
    }

    // Adjust horizontally
    if (newCol > prevCol) {
      for (let i = prevCol; i < newCol; ++i) this._xterm.write("\x1b[C");
    } else {
      for (let i = newCol; i < prevCol; ++i) this._xterm.write("\x1b[D");
    }

    // Set new offset
    this._cursor = newCursor;
  }

  /** Add highighting to the given text based on ANSI escape sequences. */
  private static _highlightText(text: string) {
    return (
      text
        // Match for error
        .replace(
          /\w*\s?(\w*)error(:|\[.*?:)/gim,
          (match) =>
            PgTerminal.error(match.substring(0, match.length - 1)) +
            match[match.length - 1]
        )

        // Match for warning
        .replace(/(\d+\s)?warning(s|:)?/gim, (match) => {
          // warning:
          if (match.endsWith(":")) {
            return (
              PgTerminal.warning(match.substring(0, match.length - 1)) +
              match[match.length - 1]
            );
          }

          // 1 warning, 2 warnings
          return PgTerminal.warning(match);
        })

        // Match until ':' from the start of the line: e.g SUBCOMMANDS:
        // TODO: Highlight the text from WASM so we don't have to do PgTerminal.
        .replace(/^(.*?:)/gm, (match) => {
          if (
            /(http|{|})/.test(match) ||
            /"\w+":/.test(match) ||
            /\(\w+:/.test(match) ||
            /^\s*\|/.test(match) ||
            /^\s?\d+/.test(match)
          ) {
            return match;
          }

          if (!match.includes("   ")) {
            if (match.startsWith(" ")) {
              return PgTerminal.bold(match); // Indented
            }
            if (!match.toLowerCase().includes("error")) {
              return PgTerminal.primary(match);
            }
          }

          return match;
        })

        // Secondary text color for (...)
        .replace(/\(.+\)/gm, (match) =>
          match === "(s)" ? match : PgTerminal.secondaryText(match)
        )

        // Numbers
        .replace(/^\s*\d+$/, (match) => PgTerminal.secondary(match))

        // Progression [1/5]
        .replace(/\[\d+\/\d+\]/, (match) =>
          PgTerminal.bold(PgTerminal.secondaryText(match))
        )
    );
  }
}
