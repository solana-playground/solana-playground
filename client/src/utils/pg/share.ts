import { SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { ExplorerJSON } from "./explorer";

export class PgShare {
  static async getShare(id: string) {
    const resp = await fetch(`${SERVER_URL}/share${id}`);

    const result = await PgCommon.checkForRespErr(resp.clone());
    if (result?.err) throw new Error(result.err);

    const data: ExplorerJSON = await resp.json();

    return data;
  }
}
