import { NETWORKS } from "../../constants";
import { PgCommon } from "../../utils/pg";
import { createSetting } from "../create";

export const endpoint = createSetting({
  id: "connection.endpoint",
  name: "Endpoint",
  description: "RPC URL that lets you interact with a specific Solana cluster",
  values: NETWORKS.map((n) => ({ name: n.name, value: n.endpoint })),
  parseCustomValue: (v) => {
    if (PgCommon.isUrl(v)) return v;
    throw new Error(`The setting value must be a URL: ${v}`);
  },
});
