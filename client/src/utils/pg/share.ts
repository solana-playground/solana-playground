import { ExplorerJSON, PgExplorer } from "./explorer";
import { PgServer } from "./server";
import { PgValidator } from "./validator";

export class PgShare {
  /**
   * @returns shared project info
   */
  static async get(id: string) {
    const shareData = await PgServer.shareGet(id);

    // Convert `ShareGetResponse` to `ExplorerJSON` to make shares backwards
    // compatible with the old shares
    const newData: ExplorerJSON = { files: {} };

    for (const path in shareData.files) {
      const fileInfo = shareData.files[path];
      newData.files[path] = {
        content: fileInfo.content,
        meta: {
          current: fileInfo.current,
          tabs: fileInfo.tabs,
        },
      };
    }

    return newData;
  }

  /**
   * Share a new project.
   *
   * @returns object id if sharing is successful.
   */
  static async new() {
    const explorer = await PgExplorer.get();
    const shareFiles = explorer.getShareFiles();
    return await PgServer.shareNew(shareFiles);
  }

  /**
   * Get whether the current pathname is in a valid format
   *
   * @param pathname current pathname
   * @returns whether the current pathname is in a valid format
   */
  static isValidPathname(pathname: string) {
    return PgValidator.isHex(pathname.substring(1));
  }
}
