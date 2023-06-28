import { Lang, TupleFiles } from "./explorer";

/** Custom framework */
export type Framework<N extends string = string> = {
  /** Framework name */
  name: N;
  /** Framework program language */
  language: Lang;
  /** Image src */
  src: string;
  /** Lazy load default framework files */
  importFiles: () => Promise<{ files: TupleFiles }>;
  /** Default file to open after loading the default framework files */
  defaultOpenFile?: string;
  /** Whether to make the image circular */
  circleImage?: boolean;
};

export class PgFramework {
  /**
   * Create a framework with inferred types.
   *
   * @param framework framework to create
   * @returns the framework with inferred types
   */
  static create<N extends string>(framework: Framework<N>) {
    return framework;
  }
}
