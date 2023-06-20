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
