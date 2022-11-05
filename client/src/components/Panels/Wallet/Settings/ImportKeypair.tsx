import { ChangeEvent, FC } from "react";
import { useAtom } from "jotai";
import { Keypair } from "@solana/web3.js";

import UploadButton from "../../../UploadButton";
import { SettingsItem, SettingsItemProps } from "./SettingsItem";
import { pgWalletAtom } from "../../../../state";
import { PgCommon, PgWallet } from "../../../../utils/pg";

export const ImportKeypair: FC<SettingsItemProps> = ({ close }) => {
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
      close();
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <UploadButton accept=".json" onUpload={handleUpload} noButton>
      <SettingsItem>Import Keypair</SettingsItem>
    </UploadButton>
  );
};
