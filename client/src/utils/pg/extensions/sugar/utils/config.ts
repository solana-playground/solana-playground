import { toBigNumber } from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

import { PgCommon } from "../../../common";
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
    hiddenSettings: configData.hiddenSettings
      ? {
          ...configData.hiddenSettings,
          hash: Array.from(Buffer.from(configData.hiddenSettings.hash)),
        }
      : null,
    uploadConfig: configData.uploadConfig,
    // @ts-ignore
    guards: configData.guards,
  };
};

export const saveConfigData = async (configData: ConfigData) => {
  await PgExplorer.run({
    newItem: [
      PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH,
      PgCommon.prettyJSON({
        ...configData,
        size: configData.size.toNumber(),
        hiddenSettings: configData.hiddenSettings
          ? {
              ...configData.hiddenSettings,
              hash: PgCommon.decodeBytes(
                Uint8Array.from(configData.hiddenSettings.hash)
              ),
            }
          : null,
        creators: configData.creators.map((c) => ({
          ...c,
          address: c.address.toBase58(),
        })),
      }),
      {
        override: true,
        openOptions: { onlyOpenIfAlreadyOpen: true },
      },
    ],
  });
};
