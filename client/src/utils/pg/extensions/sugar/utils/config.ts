import { toBigNumber } from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

import { PgExplorer } from "../../../explorer";
import { PgTerminal } from "../../../terminal";
import { ConfigData, ToPrimitive } from "../types";

export const loadConfigData = async (): Promise<ConfigData> => {
  const configStr = await PgExplorer.run({
    getFileContent: [PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH],
  });
  if (!configStr)
    throw new Error(
      `Config file not found. Run ${PgTerminal.bold(
        "'sugar create-config'"
      )} to create a new config.`
    );

  const configData: ToPrimitive<ConfigData> = JSON.parse(configStr);

  return {
    size: toBigNumber(configData.size),
    symbol: configData.symbol,
    royalties: configData.royalties,
    isMutable: configData.isMutable,
    isSequential: configData.isSequential,
    creators: configData.creators.map((c) => ({
      ...c,
      address: new PublicKey(c.address),
    })),
    hiddenSettings: configData.hiddenSettings,
    uploadConfig: configData.uploadConfig,
    // @ts-ignore
    guards: configData.guards,
  };
};
