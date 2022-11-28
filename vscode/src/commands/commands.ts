import { processAddress } from "./address";
import { processAirdrop } from "./airdrop";
import { processBalance } from "./balance";
import { processBuild } from "./build";
import { processConnection } from "./connection";
import {
  processCreateAnchor,
  processCreateNative,
  processCreateSeahorse,
} from "./create";
import { processDeploy } from "./deploy";
import { processShare } from "./share";
import { PgFs } from "../utils";

export enum Command {
  CreateNative,
  CreateAnchor,
  CreateSeahorse,
  Build,
  Deploy,
  Share,
  Address,
  Airdrop,
  Balance,
  Connection,
}

export const processCmd = async (cmd: Command) => {
  try {
    switch (cmd) {
      case Command.Address:
        await processAddress();
        break;
      case Command.Airdrop:
        await processAirdrop();
        break;
      case Command.Balance:
        await processBalance();
        break;
      case Command.Build:
        await processBuild();
        break;
      case Command.Connection:
        await processConnection();
        break;
      case Command.CreateAnchor:
        await processCreateAnchor();
        break;
      case Command.CreateNative:
        await processCreateNative();
        break;
      case Command.CreateSeahorse:
        await processCreateSeahorse();
        break;
      case Command.Deploy:
        await processDeploy();
        break;
      case Command.Share:
        await processShare();
        break;
    }
  } catch (e: any) {
    throw new Error(e.message);
  } finally {
    PgFs.resetStatics();
  }
};
