import { PgExplorer } from "../../../explorer";
import { PgTerminal } from "../../../terminal";
import { ConfigData } from "../types";

export const getConfigData = async () => {
  const configStr = await PgExplorer.run({
    getFileContent: [PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH],
  });
  if (!configStr)
    throw new Error(
      `Config file not found. Run ${PgTerminal.bold(
        "'sugar create-config'"
      )} to create a new config.`
    );

  return JSON.parse(configStr) as ConfigData;
};
