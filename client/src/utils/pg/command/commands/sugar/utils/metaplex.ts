import {
  bundlrStorage,
  Metaplex,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";

import { getCluster } from "./utils";
import { BundlrEnpoints } from "../constants";
import { PgConnection } from "../../../../connection";
import { PgWallet } from "../../../../wallet";
import { PgSettings } from "../../../../settings";

export const getMetaplex = async (
  endpoint: string = PgSettings.connection.endpoint
) => {
  return Metaplex.make(PgConnection.create({ endpoint }))
    .use(walletAdapterIdentity(PgWallet))
    .use(
      bundlrStorage({
        address:
          (await getCluster(endpoint)) === "mainnet-beta"
            ? BundlrEnpoints.MAINNET
            : BundlrEnpoints.DEVNET,
        providerUrl: endpoint,
      })
    );
};
