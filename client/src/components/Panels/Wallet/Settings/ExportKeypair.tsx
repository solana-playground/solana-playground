import DownloadButton from "../../../DownloadButton";
import { SettingsItem } from "./SettingsItem";
import { PgCommon, PgWallet } from "../../../../utils/pg";

export const ExportKeypair = () => {
  const walletKp = PgWallet.getKp();

  return (
    <DownloadButton
      href={PgCommon.getUtf8EncodedString(Array.from(walletKp.secretKey))}
      download="wallet-keypair.json"
      noButton
    >
      <SettingsItem>Export Keypair</SettingsItem>
    </DownloadButton>
  );
};
