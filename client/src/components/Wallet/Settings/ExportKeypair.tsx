import { PgCommon, PgWallet } from "../../../utils/pg";

export const useExportKeypair = () => {
  return {
    exportKeypair: () => {
      PgCommon.export(
        "wallet-keypair.json",
        PgCommon.getUtf8EncodedString(Array.from(PgWallet.keypairBytes))
      );
    },
  };
};
