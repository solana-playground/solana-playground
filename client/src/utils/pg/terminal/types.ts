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
  /** Execute the given input. */
  execute: (input: string) => Promise<R>;
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
