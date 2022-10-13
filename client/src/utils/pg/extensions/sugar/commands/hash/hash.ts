import * as anchor from "@project-serum/anchor";

import { PgCommon } from "../../../../common";
import { PgTerminal } from "../../../../terminal";
import { loadCache, loadConfigData, saveConfigData } from "../../utils";

export const processHash = async (compare: string | undefined) => {
  const configData = await loadConfigData();
  const term = await PgTerminal.get();

  if (compare) {
    const cache = await loadCache();
    const hashB58 = getB58Hash(PgCommon.prettyJSON(cache));
    term.println(`Cache hash: ${hashB58}`);

    if (compare !== hashB58) {
      throw new Error("Hashes do not match!");
    }

    term.println("Hashes match!");
  }

  if (configData.hiddenSettings) {
    term.println(`Hash: ${await hashAndUpdate()}`);
  } else {
    throw new Error("No hidden settings found in config file.");
  }
};

export const hashAndUpdate = async () => {
  const configData = await loadConfigData();
  const hiddenSettings = configData.hiddenSettings;
  if (!hiddenSettings) {
    throw new Error(
      "Trying to update hidden settings when it's not specified in the config."
    );
  }

  const cache = await loadCache();
  const hash = getB58Hash(PgCommon.prettyJSON(cache));
  hiddenSettings.hash = Array.from(Buffer.from(hash));

  await saveConfigData(configData);

  return PgCommon.decodeBytes(Buffer.from(hiddenSettings.hash));
};

// FIXME: This ends up not producing the same hash with the sugar cli
const getB58Hash = (data: string) =>
  anchor.utils.bytes.bs58
    .encode(anchor.utils.bytes.hex.decode(anchor.utils.sha256.hash(data)))
    .substring(0, 32);
