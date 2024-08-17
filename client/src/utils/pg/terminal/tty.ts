import { Terminal as XTerm } from "xterm";

import { PgAutocomplete } from "./autocomplete";
import { PgTerminal } from "./terminal";
import { getLastToken } from "./utils";
import { PgCommon } from "../common";
import type {
  ActiveCharPrompt,
  ActivePrompt,
  CommandManager,
  PrintOptions,
} from "./types";

/**
 * TTY manages text I/O related things such as prompting, input parsing and
 * printing messages to the terminal.
 */
export class PgTty {
  private _xterm: XTerm;
  private _cmdManager: CommandManager;
  private _autocomplete: PgAutocomplete;
  private _termSize: {
    cols: number;
    rows: number;
  };
  private _firstInit = true;
  private _promptPrefix = "";
  private _continuationPromptPrefix = "";
  private _cursor = 0;
  private _input = "";

  constructor(
    xterm: XTerm,
    cmdManager: CommandManager,
    autocomplete: PgAutocomplete
  ) {
    this._xterm = xterm;
    this._cmdManager = cmdManager;
    this._autocomplete = autocomplete;
    this._termSize = {
      cols: this._xterm.cols,
      rows: this._xterm.rows,
    };
  }

  /** Whether it is the initial read */
  get firstInit() {
    return this._firstInit;
  }

  /** Current input in the terminal */
  get input() {
    return this._input;
  }

  /** Current cursor position */
  get cursor() {
    return this._cursor;
  }

  /** TTY size (columns and rows) */
  get size() {
    return this._termSize;
  }

  /** Active terminal buffer */
  get buffer() {
    return this._xterm.buffer.active;
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
   * Replace input with the given input.
   *
   * This function clears all the lines that the current input occupies and
   * then replaces them with the new input.
   */
  setInput(newInput: string, noClearInput?: boolean) {
    if (!noClearInput) this.clearInput();

    // Write the new input lines, including the current prompt
    const newPrompt = this._applyPrompts(newInput);
    this.print(newPrompt);

    // Trim cursor overflow
    if (this._cursor > newInput.length) {
      this._cursor = newInput.length;
    }

    // Move the cursor to the appropriate row/col
    const newCursor = this._applyPromptOffset(newInput, this._cursor);
    const newLines = PgTty._countLines(newPrompt, this._termSize.cols);
    const { col, row } = PgTty._offsetToColRow(
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
    if (!opts?.noColor) msg = this._highlightText(msg);
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
    const allRows = PgTty._countLines(currentPrompt, this._termSize.cols);

    // Get the line we are currently in
    const promptCursor = this._applyPromptOffset(this._input, this._cursor);
    const { row } = PgTty._offsetToColRow(
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
  private _applyPrompts(input: string) {
    return (
      this._promptPrefix +
      input.replace(/\n/g, "\n" + this._continuationPromptPrefix)
    );
  }

  /** Get the current line. */
  private _getCurrentLine(offset: number = 0) {
    const buffer = this.buffer;
    return buffer.getLine(buffer.baseY + buffer.cursorY - offset);
  }

  /**
   * Advance the `offset` as required in order to accompany the prompt
   * additions to the input.
   */
  private _applyPromptOffset(input: string, offset: number) {
    const newInput = this._applyPrompts(input.substring(0, offset));
    return newInput.length;
  }

  /** Write the new cursor position. */
  private _writeCursorPosition(newCursor: number) {
    // Apply prompt formatting to get the visual status of the display
    const inputWithPrompt = this._applyPrompts(this._input);

    // Estimate previous cursor position
    const prevPromptOffset = this._applyPromptOffset(this._input, this._cursor);
    const { col: prevCol, row: prevRow } = PgTty._offsetToColRow(
      inputWithPrompt,
      prevPromptOffset,
      this._termSize.cols
    );

    // Estimate next cursor position
    const newPromptOffset = this._applyPromptOffset(this._input, newCursor);
    const { col: newCol, row: newRow } = PgTty._offsetToColRow(
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
  private _highlightText(text: string) {
    // Prompt highlighting
    if (this._promptPrefix && text.startsWith(this._promptPrefix)) {
      const inputWithoutPrefix = text.replace(this._promptPrefix, "");
      if (inputWithoutPrefix) {
        // Autocomplete hints
        const candidates = this._autocomplete.getCandidates(inputWithoutPrefix);
        if (candidates.length) {
          const [candidate] = candidates;
          const lastToken = getLastToken(inputWithoutPrefix);
          if (candidate !== lastToken) {
            const missingText = candidate.replace(lastToken, "");
            text = text.replace(
              inputWithoutPrefix,
              inputWithoutPrefix + PgTerminal.secondaryText(missingText)
            );
          }
        }

        // Command based highlighting
        for (const cmd of this._cmdManager.getNames()) {
          if (inputWithoutPrefix.startsWith(cmd)) {
            text = text.replace(cmd, PgTerminal.secondary);
            break;
          }
        }
      }
    }

    const hl = (s: string, colorCb: (s: string) => string) => {
      if (s.endsWith(":")) {
        return colorCb(s.substring(0, s.length - 1)) + s[s.length - 1];
      }

      return colorCb(s);
    };

    return (
      text
        // Match for error
        .replace(/\w*\s?(\w*)error(:|\[.*?:)/gim, (match) =>
          hl(match, PgTerminal.error)
        )

        // Match for warning
        .replace(/(\d+\s)?warning(s|:)?/gim, (match) =>
          hl(match, PgTerminal.warning)
        )

        // Match until ':' from the start of the line: e.g "Commands:"
        .replace(/^(.*?:)/gm, (match) => {
          if (
            /(http|{|})/.test(match) ||
            /"\w+":/.test(match) ||
            /\(\w+:/.test(match) ||
            /^\s*\|/.test(match) ||
            /^\s?\d+/.test(match) ||
            /\(/.test(match)
          ) {
            return match;
          }

          if (!match.includes("   ")) {
            if (match.startsWith(" ")) {
              // Indented
              return hl(match, PgTerminal.bold);
            }
            if (!match.toLowerCase().includes("error")) {
              return hl(match, PgTerminal.primary);
            }
          }

          return match;
        })

        // Secondary text color for (...)
        .replace(/\(.+\)/gm, (match) =>
          match === "(s)" ? match : PgTerminal.secondaryText(match)
        )

        // Numbers
        .replace(/^\s*\d+$/, PgTerminal.secondary)

        // Progression [1/5]
        .replace(/\[\d+\/\d+\]/, (match) =>
          PgTerminal.bold(PgTerminal.secondaryText(match))
        )
    );
  }

  /**
   * Convert offset at the given input to col/row location.
   *
   * This function is not optimized and practically emulates via brute-force
   * the navigation on the terminal, wrapping when they reach the column width.
   */
  private static _offsetToColRow(
    input: string,
    offset: number,
    maxCols: number
  ) {
    let row = 0;
    let col = 0;

    for (let i = 0; i < offset; ++i) {
      const chr = input.charAt(i);
      if (chr === "\n") {
        col = 0;
        row += 1;
      } else {
        col += 1;
        if (col > maxCols) {
          col = 0;
          row += 1;
        }
      }
    }

    return { row, col };
  }

  /** Count the lines of the given input. */
  private static _countLines(input: string, maxCols: number) {
    return PgTty._offsetToColRow(input, input.length, maxCols).row + 1;
  }
}
