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
  return Metaplex.make(PgConnection.createConnectionFromUrl(endpoint))
    .use(walletAdapterIdentity(await PgWallet.get()))
    .use(
      bundlrStorage({
        address:
          (await getCluster(endpoint)) === "devnet"
            ? BundlrEnpoints.DEVNET
            : BundlrEnpoints.MAINNET,
        providerUrl: endpoint,
      })
    );
};
