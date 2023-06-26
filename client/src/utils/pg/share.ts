import { PgCommon } from "./common";
import { ExplorerFiles, PgExplorer } from "./explorer";
import { PgServer, ShareData } from "./server";

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
   * @param opts options
   * - `includeMetadata`: Whether to include all file metadata when sharing
   * @returns the share object id
   */
  static async new(opts?: { includeMetadata?: boolean }) {
    const files = PgExplorer.files;

    // Temporary files are already in a valid form to re-share
    if (PgExplorer.isTemporary) return await this._new(files, opts);

    const shareFiles: ExplorerFiles = {};

    for (let path in files) {
      if (!path.startsWith(PgExplorer.getCurrentSrcPath())) continue;

      const itemInfo = files[path];

      // Remove workspace from path because share only needs /src
      path = path.replace(
        PgExplorer.currentWorkspacePath,
        PgExplorer.PATHS.ROOT_DIR_PATH
      );

      shareFiles[path] = itemInfo;
    }

    return await this._new(shareFiles, opts);
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
   * @param opts options
   * - `includeMetadata`: Whether to include all file metadata when sharing
   * @returns the share object id
   */
  private static async _new(
    files: ExplorerFiles,
    opts?: { includeMetadata?: boolean }
  ) {
    if (!Object.keys(files).length) throw new Error("Empty share");

    const data: ShareData = { files: {} };

    for (const path in files) {
      const itemInfo = files[path];
      data.files[path] = { content: itemInfo.content };

      if (opts?.includeMetadata) {
        // To make it backwards compatible with the old shares
        data.files[path].tabs = itemInfo.meta?.tabs;
        data.files[path].current = itemInfo.meta?.current;
      }
    }

    return await PgServer.shareNew(data);
  }
}
