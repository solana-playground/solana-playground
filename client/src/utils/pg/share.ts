import { PgCommon } from "./common";
import { ExplorerJSON, PgExplorer } from "./explorer";
import { PgServer, ShareGetResponse } from "./server";

export class PgShare {
  /**
   * @returns shared project info
   */
  static async get(pathname: string) {
    const id = pathname.slice(1);
    const shareData = await PgServer.shareGet(id);

    // Convert `ShareGetResponse` to `ExplorerJSON` to make shares backwards
    // compatible with the old shares
    const explorer: ExplorerJSON = { files: {} };

    for (const path in shareData.files) {
      const fileInfo = shareData.files[path];
      explorer.files[path] = {
        content: fileInfo.content,
        meta: {
          current: fileInfo.current,
          tabs: fileInfo.tabs,
        },
      };
    }

    return explorer;
  }

  /**
   * Share a new project.
   *
   * @returns object id if sharing is successful.
   */
  static async new() {
    const explorer = await PgExplorer.get();
    const files = explorer.files;

    // Shared files are already in a valid form to re-share
    if (explorer.isShared) return await PgServer.shareNew({ files });

    const shareFiles: ShareGetResponse = { files: {} };

    for (let path in files) {
      if (!path.startsWith(explorer.getCurrentSrcPath())) continue;

      const itemInfo = files[path];

      // We are removing the workspace from path because share only needs /src
      path = path.replace(
        explorer.currentWorkspacePath,
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
   * Get whether the current pathname is in a valid format
   *
   * @param pathname current pathname
   * @returns whether the current pathname is in a valid format
   */
  static isValidPathname(pathname: string) {
    return PgCommon.isHex(pathname.substring(1));
  }
}
