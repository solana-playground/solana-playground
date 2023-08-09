import { Lang, PgCommon, RequiredKey, TupleFiles } from "../utils/pg";

/** Custom framework parameter */
type FrameworkParam<N extends string> = {
  /** Framework name */
  name: N;
  /** Framework program language */
  language: Lang;
  /** Image src */
  src: string;
  /** Lazy load default framework files, defaults to `./files` */
  importFiles?: () => Promise<{ files: TupleFiles }>;
  /** Default file to open after loading the default framework files */
  defaultOpenFile?: string;
  /** Whether to make the image circular */
  circleImage?: boolean;
};

/** Created framework */
export type Framework<N extends string = string> = RequiredKey<
  FrameworkParam<N>,
  "importFiles"
>;

/**
 * Create a framework with inferred types.
 *
 * @param framework framework to create
 * @returns the framework with inferred types
 */
export const createFramework = <N extends string>(
  framework: FrameworkParam<N>
) => {
  framework.importFiles ??= () => {
    return import(`./${PgCommon.toKebabFromTitle(framework.name)}/files`);
  };
  return framework as Framework<N>;
};
