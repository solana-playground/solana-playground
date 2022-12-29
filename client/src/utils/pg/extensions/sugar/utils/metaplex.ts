import {
  bundlrStorage,
  Metaplex,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";

import { PgConnection } from "../../../connection";
import { PgWallet } from "../../../wallet";
import { BundlrEnpoints } from "../constants";
import { getCluster } from "./utils";

export const getMetaplex = async (endpoint: string) => {
  return Metaplex.make(PgConnection.createConnection({ endpoint }))
    .use(walletAdapterIdentity(await PgWallet.get()))
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
