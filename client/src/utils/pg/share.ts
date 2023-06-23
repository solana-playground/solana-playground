import { PgCommon } from "./common";
import { ExplorerFiles, PgExplorer } from "./explorer";
import { PgServer, ShareGetResponse } from "./server";

export class PgShare {
  /**
   * Get the shared project files from the given path.
   *
   * @param id shared project id
   * @returns shared project files
   */
  static async get(id: string) {
    const shareData = await PgServer.shareGet(id);

    // Convert `ShareGetResponse` to `ExplorerFiles` to make shares backwards
    // compatible with the old shares
    const files: ExplorerFiles = {};

    for (const path in shareData.files) {
      const fileInfo = shareData.files[path];
      files[path] = {
        content: fileInfo.content,
        meta: {
          current: fileInfo.current,
          tabs: fileInfo.tabs,
        },
      };
    }

    return files;
  }

  /**
   * Share a new project.
   *
   * @returns object id if sharing is successful.
   */
  static async new() {
    const files = PgExplorer.files;

    // Temporary files are already in a valid form to re-share
    if (PgExplorer.isTemporary) return await PgServer.shareNew({ files });

    const shareFiles: ShareGetResponse = { files: {} };

    for (let path in files) {
      if (!path.startsWith(PgExplorer.getCurrentSrcPath())) continue;

      const itemInfo = files[path];

      // We are removing the workspace from path because share only needs /src
      path = path.replace(
        PgExplorer.currentWorkspacePath,
        PgExplorer.PATHS.ROOT_DIR_PATH
      );

      // To make it backwards compatible with the old shares
      shareFiles.files[path] = {
        content: itemInfo.content,
        current: itemInfo.meta?.current,
        tabs: itemInfo.meta?.tabs,
      };
    }

    if (!Object.keys(shareFiles.files).length) throw new Error("Empty share");

    return await PgServer.shareNew(shareFiles);
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
}
