import {
  FileEntry,
  PgCommon,
  PgExplorer,
  PgJsRuntimeImporter,
  PgLanguage,
  PgTerminal,
} from "../../utils";
import { createArgs } from "../create";

/**
 * Crate common arguments.
 *
 * @param parentPath path that is expected to be run inside of
 * @returns the common arguments
 */
export const createCommonArgs = (parentPath: string) => {
  return createArgs([
    {
      name: "paths",
      optional: true,
      multiple: true,
      values: (token) => {
        if (token.startsWith(PgExplorer.PATHS.ROOT_DIR_PATH)) {
          const path = token.endsWith("/")
            ? token
            : PgExplorer.getParentPathFromPath(token);
          const folder = PgExplorer.getFolderContent(path);
          return [
            ...folder.files
              .map((name) => PgCommon.joinPaths(path, name))
              .filter(PgLanguage.getIsPathJsLike),
            ...folder.folders
              .map((name) => PgCommon.joinPaths(path, name))
              .map(PgCommon.appendSlash),
          ];
        }

        return PgExplorer.getAllFiles()
          .map(([path]) => path)
          .filter(PgLanguage.getIsPathJsLike)
          .map(PgExplorer.toRelativePath)
          .filter((path) => path.startsWith(parentPath))
          .map((path) => path.replace(PgCommon.appendSlash(parentPath), ""));
      },
    },
  ]);
};

/**
 * Process `run` or `test` command.
 *
 * @param params named parameters
 * - `paths`: file paths to run or test
 * - `isTest`: whether to execute as test
 * - `folderPath`: folder to look the files from
 * - `defaultFile`: file to create if non-existent (relative to `folderPath`)
 */
export const processCommon = async (params: {
  paths: string[] | undefined;
  isTest: boolean;
  folderPath: string;
  defaultFile: FileEntry;
}) => {
  const { paths, isTest, folderPath, defaultFile } = params;
  PgTerminal.println(
    PgTerminal.info(`Running ${isTest ? "tests" : "client"}...`)
  );

  const { PgJsRuntime } = await PgJsRuntimeImporter.import();

  // Run the script only at the given path
  if (paths?.length) {
    // The path can be a file name that's expected to run inside the `client`
    // or `tests` directory based on the command that's running
    for (const path of paths) {
      const code =
        PgExplorer.getFileContent(path) ??
        PgExplorer.getFileContent(PgCommon.joinPaths(folderPath, path));
      if (!code) throw new Error(`File \`${path}\` doesn't exist`);

      const fileName = PgExplorer.getItemNameFromPath(path);
      if (!PgLanguage.getIsPathJsLike(fileName)) {
        throw new Error(`File \`${fileName}\` is not a script file`);
      }

      await PgJsRuntime.execute({ fileName, code, isTest });
    }

    return;
  }

  // Create default client/test if the folder is empty
  const folder = PgExplorer.getFolderContent(folderPath);
  if (!folder.files.length && !folder.folders.length) {
    PgTerminal.println(
      PgTerminal.info(`Creating default ${isTest ? "test" : "client"}...`)
    );

    const [fileName, code] = defaultFile;
    await PgExplorer.createItem(PgCommon.joinPaths(folderPath, fileName), code);
    return await PgJsRuntime.execute({ fileName, code, isTest });
  }

  // Run all files inside the folder
  for (const fileName of folder.files.filter(PgLanguage.getIsPathJsLike)) {
    const code = PgExplorer.getFileContent(
      PgCommon.joinPaths(folderPath, fileName)
    )!;
    await PgJsRuntime.execute({ fileName, code, isTest });
  }
};
