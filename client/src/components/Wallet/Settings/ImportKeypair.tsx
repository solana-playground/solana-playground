import { ChangeEvent } from "react";
import { useAtom } from "jotai";
import { Keypair } from "@solana/web3.js";

import { pgWalletAtom } from "../../../state";
import { PgCommon, PgWallet } from "../../../utils/pg";

export const useImportKeypair = () => {
  const [, setPgWallet] = useAtom(pgWalletAtom);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeBytes(arrayBuffer);
      const buffer = Buffer.from(JSON.parse(decodedString));
      if (buffer.length !== 64) throw new Error("Invalid keypair");

      // Check if the keypair is valid
      Keypair.fromSecretKey(new Uint8Array(buffer));

      // Update localstorage
      PgWallet.update({
        sk: Array.from(buffer),
      });

      // Update global wallet state
      setPgWallet(new PgWallet());
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return {
    importKeypair: () => {
      PgCommon.import(handleUpload, { accept: ".json" });
    },
  };
};
