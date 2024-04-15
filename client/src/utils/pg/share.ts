import { PgCommon } from "./common";
import { ExplorerFiles, PgExplorer } from "./explorer";
import { PgServer } from "./server";

export class PgShare {
  /**
   * Get the shared project files from the given path.
   *
   * @param id shared project id
   * @returns shared project files
   */
  static async get(id: string) {
    const shareData = await PgServer.shareGet(id);

    // Convert `Share` to `ExplorerFiles` to make shares backwards
    // compatible with the old shares
    const files: ExplorerFiles = {};

    for (const path in shareData.files) {
      files[path] = { content: shareData.files[path].content };
    }

    return files;
  }

  /**
   * Share a new project.
   *
   * @param filePaths file paths to include in the shared project
   * @returns the share object id
   */
  static async new(filePaths: string[]) {
    const files = Object.entries(PgExplorer.files).reduce(
      (acc, [path, item]) => {
        if (filePaths.includes(path)) acc[path] = item;
        return acc;
      },
      {} as ExplorerFiles
    );

    // Temporary files are already in a valid form to re-share
    if (PgExplorer.isTemporary) return await this._new(files);

    const shareFiles: ExplorerFiles = {};
    for (const path in files) {
      const itemInfo = files[path];

      // Remove workspace from path because share only needs /src
      const sharePath = PgCommon.joinPaths(
        PgExplorer.PATHS.ROOT_DIR_PATH,
        PgExplorer.getRelativePath(path)
      );
      shareFiles[sharePath] = itemInfo;
    }

    return await this._new(shareFiles);
  }

  /**
   * Get whether the given id is in a valid format.
   *
   * @param id share id
   * @returns whether the given id is in a valid format
   */
  static isValidId(id: string) {
    return PgCommon.isHex(id);
  }

  /**
   * Share a new project.
   *
   * @param files share files
   * @returns the share object id
   */
  private static async _new(files: ExplorerFiles) {
    if (!Object.keys(files).length) throw new Error("Empty share");

    const shareFiles = Object.entries(files).reduce((acc, [path, data]) => {
      if (data.content) acc[path] = { content: data.content };
      return acc;
    }, {} as Record<string, { content?: string }>);

    return await PgServer.shareNew({ explorer: { files: shareFiles } });
  }
}
