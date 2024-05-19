import { parse } from "shell-quote";

import { hasTrailingWhitespace } from "./shell-utils";
import { PgCommon } from "../common";

/** Callback to create the autocomplete candidates based on the given tokens */
type AutoCompleteHandler = (tokens: string[], index: number) => string[];

/** Terminal autocomplete functionality */
export class PgAutocomplete {
  /** Autocomplete handlers */
  private _handlers: AutoCompleteHandler[];

  constructor(handlers: AutoCompleteHandler[]) {
    this._handlers = handlers;
  }

  /**
   * Get whether there is at least one handler
   *
   * @returns whether there is at least one handler
   */
  hasAnyHandler() {
    return this._handlers.length > 0;
  }

  /**
   * Temporarily set autocomplete handlers to the given handler.
   *
   * @param handler handler to set
   * @param opts handler options:
   * - `append`: whether to append the handler to the existing handlers
   * @returns an object with `restore` callback to restore the handlers
   */
  temporarilySetHandlers(
    handler: AutoCompleteHandler,
    opts?: { append?: boolean }
  ) {
    const initialHandlers = this._handlers;
    this._handlers = opts?.append ? [...initialHandlers, handler] : [handler];
    return {
      restore: () => {
        this._handlers = initialHandlers;
      },
    };
  }

  /**
   * Collect the autocomplete canditates from the given input.
   *
   * @param input terminal input
   *  @returns the sorted autocomplete candidates for the given input
   */
  getCandidates(input: string) {
    const tokens = parse(input);
    let index = tokens.length - 1;

    // Empty expressions
    if (input.trim() === "") {
      index = 0;
    } else if (hasTrailingWhitespace(input)) {
      // Expressions with danging space
      index += 1;
    }

    // Collect all auto-complete candidates from the callbacks
    const candidates = this._handlers
      .reduce((acc, cb) => {
        try {
          const candidates = cb(tokens as string[], index);
          return acc.concat(candidates);
        } catch (e) {
          console.log("Autocomplete error:", e);
          return acc;
        }
      }, [] as string[])
      .filter((text) => text.startsWith(input));

    // Candidates might not be unique
    return PgCommon.toUniqueArray(candidates).sort();
  }
}
