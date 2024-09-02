import { toBigNumber } from "@metaplex-foundation/js";

import {
  assertCorrectAuthority,
  getMetaplex,
  loadCache,
  loadConfigData,
} from "../../utils";
import { Emoji } from "../../../../constants";
import { PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processUpdate = async (
  rpcUrl: string | undefined,
  newAuthority: string | undefined,
  candyMachine: string | undefined
) => {
  const metaplex = await getMetaplex(rpcUrl);
  const configData = await loadConfigData();

  // The candy machine id specified takes precedence over the one from the cache
  const candyMachinePkStr =
    candyMachine ?? (await loadCache()).program.candyMachine;
  if (!candyMachinePkStr) {
    throw new Error("Missing candy machine id.");
  }
  let candyMachinePk;
  try {
    candyMachinePk = new PgWeb3.PublicKey(candyMachinePkStr);
  } catch {
    throw new Error(`Failed to parse candy machine id: ${candyMachinePkStr}`);
  }

  const term = await PgTerminal.get();
  term.println(`[1/2] ${Emoji.LOOKING_GLASS} Loading candy machine`);
  term.println(`${PgTerminal.bold("Candy machine ID:")} ${candyMachinePkStr}`);

  const candyClient = metaplex.candyMachines();
  const candyState = await candyClient.findByAddress({
    address: candyMachinePk,
  });
  assertCorrectAuthority(
    metaplex.identity().publicKey,
    candyState.authorityAddress
  );

  term.println(`\n[2/2] ${Emoji.COMPUTER} Updating configuration`);

  await candyClient.update({
    candyMachine: candyState,
    newAuthority: newAuthority ? new PgWeb3.PublicKey(newAuthority) : undefined,
    creators: configData.creators,
    groups: configData.guards?.groups ? configData.guards.groups : undefined,
    guards: configData.guards?.default ? configData.guards.default : undefined,
    isMutable: configData.isMutable,
    itemsAvailable: configData.size,
    sellerFeeBasisPoints: configData.royalties,
    symbol: configData.symbol,
    maxEditionSupply: toBigNumber(0),
    itemSettings: configData.hiddenSettings
      ? { type: "hidden", ...configData.hiddenSettings }
      : candyState.itemSettings,
  });
};
