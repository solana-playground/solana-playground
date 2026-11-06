import { loadCache, loadConfigData, saveConfigData } from "../../utils";
import { PgCodec, PgCommon, PgTerminal } from "../../../../utils";

export const processHash = async (compare: string | undefined) => {
  const configData = await loadConfigData();
  const term = await PgTerminal.get();

  if (compare) {
    const cache = await loadCache();
    const hashResult = await hash(PgCommon.toPrettyJson(cache));
    term.println(`Cache hash: ${hashResult}`);
    if (compare !== hashResult) throw new Error("Hashes do not match!");

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
  const hashResult = await hash(PgCommon.toPrettyJson(cache));
  hiddenSettings.hash = Array.from(PgCodec.encodeText(hashResult));
  await saveConfigData(configData);
  return hashResult;
};

// FIXME: This ends up not producing the same hash with the sugar cli
const hash = async (data: string) => {
  const hash = await PgCodec.hashSha256(data);
  const bytes = PgCodec.decodeBinary(hash, "hex");
  return PgCodec.encodeBinary(bytes, "base58").substring(0, 32);
};
