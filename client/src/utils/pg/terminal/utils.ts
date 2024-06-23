import { parse } from "shell-quote";

/**
 * Get the closest *left* word boundary of the given input at the given offset.
 */
export const closestLeftBoundary = (input: string, offset: number) => {
  const found = getWordBoundaries(input, true)
    .reverse()
    .find((x) => x < offset);
  return found === undefined ? 0 : found;
};

/**
 * Get the closest *right* word boundary of the given input at the given offset.
 */
export const closestRightBoundary = (input: string, offset: number) => {
  const found = getWordBoundaries(input, false).find((x) => x > offset);
  return found === undefined ? input.length : found;
};

/** Get all the word boundaries from the given input. */
const getWordBoundaries = (input: string, leftSide: boolean = true) => {
  let match;
  const words = [];
  const regex = /\w+/g;

  match = regex.exec(input);
  while (match) {
    if (leftSide) {
      words.push(match.index);
    } else {
      words.push(match.index + match[0].length);
    }

    match = regex.exec(input);
  }

  return words;
};

/**
 * Checks if there is an incomplete input
 *
 * An incomplete input is considered:
 * - An input that contains unterminated single quotes
 * - An input that contains unterminated double quotes
 * - An input that ends with "\"
 * - An input that has an incomplete boolean shell expression (&& and ||)
 * - An incomplete pipe expression (|)
 */
export const isIncompleteInput = (input: string) => {
  // Empty input is not incomplete
  if (input.trim() === "") {
    return false;
  }

  // Check for dangling single-quote strings
  if ((input.match(/'/g) || []).length % 2 !== 0) {
    return true;
  }
  // Check for dangling double-quote strings
  if ((input.match(/"/g) || []).length % 2 !== 0) {
    return true;
  }
  // Check for dangling boolean or pipe operations
  if ((input.split(/(\|\||\||&&)/g).pop() as string).trim() === "") {
    return true;
  }
  // Check for tailing slash
  if (input.endsWith("\\") && !input.endsWith("\\\\")) {
    return true;
  }

  return false;
};

/**
 * @returns true if the expression ends on a tailing whitespace
 */
export const hasTrailingWhitespace = (input: string) => {
  return input.match(/[^\\][ \t]$/m) !== null;
};

/**
 * @returns the last expression in the given input
 */
export const getLastToken = (input: string) => {
  // Empty expressions
  if (input.trim() === "") return "";
  if (hasTrailingWhitespace(input)) return "";

  // Last token
  const tokens = parse(input);
  return (tokens.pop() as string) || "";
};
