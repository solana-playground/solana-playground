import { getIsOption, hasTrailingWhitespace, parse } from "./utils";
import { PgCommon } from "../common";
import type { Getable } from "../types";

/** Autocomplete handler input type */
type AutocompleteHandler =
  | AutocompleteHandlerCallback
  | AutocompleteHandlerObject
  | AutocompleteHandlerArray;

/** Callback to create the autocomplete candidates based on the given tokens */
type AutocompleteHandlerCallback = (
  tokens: string[],
  index: number
) => string[];

/** Nested command definitions */
type AutocompleteHandlerObject = object;

/** Entry based handlers */
type AutocompleteHandlerArray = Getable<string[]>;

/** Terminal autocomplete functionality */
export class PgAutocomplete {
  /** Normalized (callback) autocomplete handlers */
  private _handlers: AutocompleteHandlerCallback[] = [];

  constructor(handlers: AutocompleteHandler[]) {
    this._addHandler(...handlers);
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
    handler: AutocompleteHandler,
    opts?: { append?: boolean }
  ) {
    const initialHandlers = this._handlers;
    this._handlers = opts?.append ? [...initialHandlers] : [];
    this._addHandler(handler);
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
   * @returns the sorted autocomplete candidates for the given input
   */
  getCandidates(input: string) {
    const tokens = parse(input);
    let index = tokens.length - 1;

    // Empty expressions
    if (!input.trim()) index = 0;
    // Expressions with danging space
    else if (hasTrailingWhitespace(input)) index += 1;

    // Collect all auto-complete candidates from the callbacks
    const candidates = this._handlers.reduce((acc, cb) => {
      try {
        const candidates = cb(tokens, index);
        return acc.concat(candidates);
      } catch (e) {
        console.log("Autocomplete error:", e);
        return acc;
      }
    }, [] as string[]);

    return (
      // Candidates might include duplicates
      PgCommon.toUniqueArray(candidates)
        // Sort for consistent output
        .sort((a, b) => {
          // Prioritize arguments over options
          if (getIsOption(a) && !getIsOption(b)) return 1;
          if (getIsOption(b)) return -1;
          return a.localeCompare(b);
        })
        // Only show options when the last token starts with '-'
        .filter((candidate) => {
          if (getIsOption(candidate)) {
            const lastToken = tokens.at(-1);
            if (lastToken) {
              if (candidate.startsWith("--")) return lastToken.startsWith("--");
              if (candidate.startsWith("-")) return lastToken.startsWith("-");
            }
          }

          return true;
        })
    );
  }

  /**
   * Add the given handler(s) with normalization i.e. converting all handlers
   * to a callback handler.
   *
   * @param handlers handler(s) to add
   */
  private _addHandler(...handlers: AutocompleteHandler[]) {
    this._handlers.push(
      ...handlers.map((handler): AutocompleteHandlerCallback => {
        if (Array.isArray(handler) || typeof handler === "function") {
          // Example:
          //
          // handler = ["anchor idl init", "anchor idl upgrade"]
          //
          // index: 0
          // tokens: []
          // return: ["anchor"]
          //
          // index: 1
          // tokens: ["anchor"]
          // return: ["idl"]
          //
          // index: 2
          // tokens: ["anchor", "idl"]
          // return: ["init", "upgrade"]
          return (tokens, index) => {
            return (PgCommon.callIfNeeded(handler) as string[])
              .map(parse)
              .map((entryTokens) => {
                const lastIndex = tokens.length - 1;
                const matches = tokens.every((token, i) =>
                  i === lastIndex && index <= lastIndex
                    ? entryTokens[i]?.startsWith(token)
                    : token === entryTokens[i]
                );
                if (matches) return entryTokens.at(index);
                return null;
              })
              .filter(PgCommon.isNonNullish);
          };
        }

        // Example:
        //
        // handler = {
        //   anchor: {
        //     idl: {
        //       init: {},
        //       upgrade: {}
        //     }
        //   }
        // }
        //
        // index: 0
        // tokens: []
        // return: ["anchor"]
        //
        // index: 1
        // tokens: ["anchor"]
        // return: ["idl"]
        //
        // index: 2
        // tokens: ["anchor", "idl"]
        // return: ["init", "upgrade"]
        return (tokens, index) => {
          const recursivelyGetCandidates = (obj: any, i = 0): string[] => {
            if (i > index) return [];

            const candidates = [];
            for (const [key, value] of PgCommon.entries(obj)) {
              // Argument values
              if (PgCommon.isInt(key)) {
                // Skip options
                if (tokens[i] && getIsOption(tokens[i])) continue;

                if (index - i === +key && value.values) {
                  const token = tokens[index];
                  const values: string[] = PgCommon.callIfNeeded(value.values);
                  const filteredValues = values.filter(
                    (v) => !token || v.startsWith(token)
                  );
                  candidates.push(...filteredValues);
                } else if (value.multiple) {
                  candidates.push(...recursivelyGetCandidates(obj, i + 1));
                } else {
                  // Options are also valid after arguments
                  const opts = Object.entries(obj).reduce(
                    (acc, [prop, val]) => {
                      if (getIsOption(prop)) acc[prop] = val;
                      return acc;
                    },
                    {} as typeof obj
                  );

                  // The completion index for the next option is the sum of
                  // `i` and how many previous arguments exist.
                  //
                  // The calculation below assumes all arguments have been
                  // passed beforehand, which means option completions between
                  // arguments won't work. Supplying options before or after
                  // all arguments work expected.
                  //
                  // TODO: Calculate how many arguments exist properly to make
                  // option completions between arguments work
                  const argAmount = Object.keys(obj).filter(
                    PgCommon.isInt
                  ).length;
                  candidates.push(
                    ...recursivelyGetCandidates(opts, i + argAmount)
                  );
                }
              }
              // Subcommands or options
              else if (!tokens[i] || key.startsWith(tokens[i])) {
                // Current key and doesn't exist previously in tokens
                if (i === index && !tokens.slice(0, i).includes(key)) {
                  candidates.push(key);
                }
                // Next candidates
                if (key === tokens[i]) {
                  if (getIsOption(key)) {
                    // Remove long/short to not suggest duplicates
                    if (value.other) {
                      obj = { ...obj };
                      delete obj[value.other];
                    }

                    if (index - i === 1 && value.values) {
                      const token = tokens[index];
                      const values: string[] = PgCommon.callIfNeeded(
                        value.values
                      );
                      const filteredValues = values.filter(
                        (v) => !token || v.startsWith(token)
                      );
                      candidates.push(...filteredValues);
                    }

                    candidates.push(
                      ...recursivelyGetCandidates(
                        obj,
                        // Decide the next index based on whether the option
                        // takes in a value
                        value.takeValue ? i + 2 : i + 1
                      )
                    );
                  } else {
                    // Subcommand
                    candidates.push(...recursivelyGetCandidates(value, i + 1));
                  }
                }
              }
            }
            return candidates;
          };

          return recursivelyGetCandidates(handler);
        };
      })
    );
  }
}
