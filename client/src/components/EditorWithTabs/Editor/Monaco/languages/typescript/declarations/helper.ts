import * as monaco from "monaco-editor";

import {
  ClientPackageName,
  Disposable,
  PgCommon,
  PgExplorer,
  TupleString,
  TupleFiles,
} from "../../../../../../../utils/pg";

/**
 * Some declaration files need to be declared for them to be referenced by other
 * declaration files.
 *
 * @param packageName package name to be referenced in declaration files
 * @param module contents of the module
 * @returns module declaration for the given package
 */
export const declareModule = (
  packageName: ClientPackageName,
  module: string = ""
) => {
  return `declare module "${packageName}" { ${module} }`;
};

/**
 * Declare a full package.
 *
 * @param packageName package name t obe referenced in declaration files
 * @param indexPath index declaration file path(Monaco)
 * @param files declaration files
 * @returns a dispose method to dispose all events
 */
export const declareFullModule = (
  packageName: ClientPackageName,
  indexPath: string,
  files: TupleFiles
): Disposable => {
  /**
   * Monaco TS worker is not able to use imports/exports if indexes are not
   * explicit, e.g. "./common" will not translate to "./common/index".
   *
   * @param path declaration file path
   * @param content declaration file content
   * @returns the [content, path] tuple
   */
  const resolveFile = (path: string, content: string): TupleString => {
    return [
      content
        // Module imports/exports
        .replace(
          /^[import|export].*from\s(.+["|'])/gm,
          (...match: TupleString) => addIndex(path, ...match)
        )
        // import("...")
        .replace(/import\((.*)\)/gm, (...match: TupleString) =>
          addIndex(path, ...match)
        ),
      path,
    ];
  };

  /**
   * Append `/index` to the given path when the path is a directory.
   *
   * @param path declaration file path
   * @param match full matched string
   * @param quotedPath quote surrounded path
   * @returns the paths with `/index` appended when the path is a directory
   */
  const addIndex = (path: string, match: string, quotedPath: string) => {
    // Import or export statement's path
    const statementPath = quotedPath.slice(1, quotedPath.length - 1);

    // Only change local imports/exports
    if (!statementPath.startsWith(".")) return match;

    // Resolve the given path
    const canonicalIndexPath =
      new URL(statementPath, "x://x.x/" + path).href.slice(8) + "/index.d.ts";

    // Check if the `path` is a directory path with "index.d.ts" inside it
    const isFolder = files.some(([p]) => p === canonicalIndexPath);
    if (isFolder) {
      return match.replace(
        quotedPath,
        quotedPath.slice(0, quotedPath.length - 1) +
          "/index" +
          quotedPath.slice(quotedPath.length - 1)
      );
    }

    return match;
  };

  const disposables = files.map(([path, content]) => {
    return monaco.languages.typescript.typescriptDefaults.addExtraLib(
      ...resolveFile(path, content)
    );
  });

  // Renaming exports allows us to use '@' and export everything
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare module "${packageName}" {
  export * from "${PgCommon.joinPaths([
    PgExplorer.getParentPathFromPath(indexPath),
    "old-index",
  ])}"
}`,
    indexPath
  );

  return {
    dispose: () => disposables.forEach(({ dispose }) => dispose()),
  };
};
