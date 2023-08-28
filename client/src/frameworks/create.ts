import {
  ExplorerFiles,
  Lang,
  PgCommon,
  RequiredKey,
  SyncOrAsync,
  TupleFiles,
} from "../utils/pg";

/** Custom framework parameter */
type FrameworkParam<N extends string> = {
  /** Framework name */
  name: N;
  /** Framework program language */
  language: Lang;
  /** Image icon src */
  icon: string;
  /** Default file to open after loading the default framework files */
  defaultOpenFile?: string;
  /** Whether to make the image circular */
  circleImage?: boolean;
  /** Get whether the given files have this framework's layout */
  getIsCurrent: (files: ExplorerFiles) => SyncOrAsync<boolean>;
  /** Lazy load default framework files, defaults to `./files` */
  importFiles?: () => Promise<{
    /** Default framework files to create on a new project */
    files: TupleFiles;
  }>;
  /** Lazy load the from playground conversion module, defaults to `./from` */
  importFromPlayground?: () => Promise<{
    /**
     * Convert the given playground layout files to the framework's original
     * layout.
     *
     * @param files playground layout files
     * @returns the frameworks' original layout files
     */
    convertFromPlayground: (files: TupleFiles) => SyncOrAsync<TupleFiles>;
  }>;
};

/** Created framework */
export type Framework<N extends string = string> = RequiredKey<
  FrameworkParam<N>,
  "getIsCurrent" | "importFiles" | "importFromPlayground"
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
  const folderPath = `./${PgCommon.toKebabFromTitle(framework.name)}/`;
  framework.importFiles ??= () => import(folderPath + "files");
  framework.importFromPlayground ??= () => import(folderPath + "from");
  return framework as Framework<N>;
};
