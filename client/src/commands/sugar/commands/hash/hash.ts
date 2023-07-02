import { loadCache, loadConfigData, saveConfigData } from "../../utils";
import { PgBytes, PgCommon, PgTerminal } from "../../../../utils/pg";

export const processHash = async (compare: string | undefined) => {
  const configData = await loadConfigData();
  const term = await PgTerminal.get();

  if (compare) {
    const cache = await loadCache();
    const hashB58 = hash(PgCommon.prettyJSON(cache));
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
  const hashResult = hash(PgCommon.prettyJSON(cache));
  hiddenSettings.hash = Array.from(Buffer.from(hashResult));

  await saveConfigData(configData);

  return PgCommon.decodeBytes(Buffer.from(hiddenSettings.hash));
};

// FIXME: This ends up not producing the same hash with the sugar cli
const hash = (data: string) => {
  return PgBytes.toBase58(PgBytes.fromHex(PgBytes.hashSha256(data))).substring(
    0,
    32
  );
};
