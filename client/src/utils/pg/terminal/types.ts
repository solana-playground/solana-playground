/** Tty print options */
export interface PrintOptions {
  /** Whether the command is sync */
  sync?: boolean;
  /** Whether to append a new line */
  newLine?: boolean;
  /** Disable automatic coloring */
  noColor?: boolean;
}

/** Executor */
export type ExecuteCommand<R = unknown> = (input: string) => Promise<R>;

export interface ActiveCharPrompt {
  promptPrefix: string;
  promise: Promise<any>;
  resolve?: (input: string) => any;
  reject?: (error: Error) => any;
}

export interface ActivePrompt extends ActiveCharPrompt {
  continuationPromptPrefix: string;
}

/** Callback to create the autocomplete candidates based on the given tokens */
export type AutoCompleteHandler = (tokens: string[], index: number) => string[];
