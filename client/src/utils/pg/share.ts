import { SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { ExplorerJSON, PgExplorer } from "./explorer";

export class PgShare {
  /**
   * @returns shared project info
   */
  static async get(id: string) {
    const resp = await fetch(`${SERVER_URL}/share${id}`);

    const result = await PgCommon.checkForRespErr(resp.clone());
    if (result?.err) throw new Error(result.err);

    const data: ExplorerJSON = await resp.json();

    return data;
  }

  /**
   * Share a new project.
   *
   * @returns object id if sharing is successful.
   */
  static async new(explorer: PgExplorer) {
    const resp = await fetch(`${SERVER_URL}/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        explorer: { files: explorer.files },
      }),
    });

    const result = await PgCommon.checkForRespErr(resp.clone());
    if (result?.err) throw new Error(result.err);

    const objectId = PgCommon.decodeArrayBuffer(result.arrayBuffer!);

    return objectId;
  }
}
