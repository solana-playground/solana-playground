import { Option, toBigNumber } from "@metaplex-foundation/js";

import { parseGuards } from "./guards";
import { PgSugar } from "../processor";
import { PgCommon, PgExplorer, PgTerminal, PgWeb3 } from "../../../utils/pg";
import type { ConfigData, ToPrimitive } from "../types";

export const loadConfigData = async (): Promise<ConfigData> => {
  const configStr = PgExplorer.getFileContent(
    PgSugar.PATHS.CANDY_MACHINE_CONFIG_FILEPATH
  );
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
      address: new PgWeb3.PublicKey(c.address),
    })),
    hiddenSettings: configData.hiddenSettings
      ? {
          ...configData.hiddenSettings,
          hash: Array.from(Buffer.from(configData.hiddenSettings.hash)),
        }
      : null,
    uploadConfig: configData.uploadConfig,
    guards: parseGuards(
      configData.guards as ToPrimitive<Option<ConfigData["guards"]>> & {
        [key: string]: any;
      }
    ),
  };
};

export const saveConfigData = async (configData: ConfigData) => {
  await PgExplorer.newItem(
    PgSugar.PATHS.CANDY_MACHINE_CONFIG_FILEPATH,
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
      openOptions: { onlyRefreshIfAlreadyOpen: true },
    }
  );
};
