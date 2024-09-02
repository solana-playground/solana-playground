/** Tty print options */
export interface PrintOptions {
  /** Whether the command is sync */
  sync?: boolean;
  /** Whether to append a new line */
  newLine?: boolean;
  /** Disable automatic coloring */
  noColor?: boolean;
}

/** Manage terminal commands */
export type CommandManager<R = unknown> = {
  /** Get the available command names. */
  getNames: () => string[];
  /**
   * Get command completions.
   *
   * Command completions are defined as an object with properties defined as
   * commands/subcommands (subcommand if depth > 0).
   *
   * # Example
   *
   * ```ts
   * {
   *   anchor: {
   *     idl: {
   *       init: {},
   *       upgrade: {}
   *     }
   *   }
   * }
   * ```
   */
  getCompletions: () => Record<string, any>;
  /** Execute from the given tokens. */
  execute: (tokens: string[]) => Promise<R>;
};

export interface ActiveCharPrompt {
  promptPrefix: string;
  promise: Promise<any>;
  resolve?: (input: string) => any;
  reject?: (error: Error) => any;
}

export interface ActivePrompt extends ActiveCharPrompt {
  continuationPromptPrefix: string;
}
