import {
  CandyCache,
  getMetaplex,
  loadCache,
  loadConfigData,
} from "../../utils";
import { Emoji } from "../../../../constants";
import { PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processGuardAdd = async (
  rpcUrl: string | undefined,
  candyMachine: string | undefined,
  candyGuard: string | undefined
) => {
  const term = await PgTerminal.get();

  term.println(`[1/3] ${Emoji.LOOKING_GLASS} Looking up candy machine`);

  // The candy machine id specified takes precedence over the one from the cache
  let candyInfo: [string, CandyCache | null];
  if (candyMachine) {
    candyInfo = [candyMachine, null];
  } else {
    const cache = await loadCache();
    candyInfo = [cache.program.candyMachine, cache];
  }
  const [candyMachinePkStr, cache] = candyInfo;

  if (!candyMachinePkStr) {
    throw new Error("Missing candy machine id.");
  }
  let candyMachinePk: PgWeb3.PublicKey;
  try {
    candyMachinePk = new PgWeb3.PublicKey(candyMachinePkStr);
  } catch {
    throw new Error(`Failed to parse candy machine id: ${candyMachinePkStr}`);
  }

  term.println(`\nCandy machine ID: ${candyMachinePkStr}`);

  // Decide whether to create a new candy guard or use an existing one
  let candyGuardPkStr = "";
  if (candyGuard) {
    candyGuardPkStr = candyGuard;
  } else if (cache) {
    candyGuardPkStr = cache.program.candyGuard;
  }

  const metaplex = await getMetaplex(rpcUrl);
  const configData = await loadConfigData();

  if (!configData.guards) {
    throw new Error("Missing guards configuration.");
  }

  let candyGuardPk;
  if (!candyGuardPkStr) {
    term.println(`\n[2/3] ${Emoji.GUARD} Initializing a candy guard`);

    const { response, candyGuardAddress } = await metaplex
      .candyMachines()
      .createCandyGuard({
        guards: configData.guards.default,
        groups: configData.guards.groups ?? undefined,
      });
    candyGuardPk = candyGuardAddress;

    term.println(`Signature: ${response.signature}`);
  } else {
    term.println(`\n[2/3] ${Emoji.COMPUTER} Loading candy guard`);

    try {
      candyGuardPk = new PgWeb3.PublicKey(candyGuardPkStr);
    } catch {
      throw new Error(`Failed to parse candy guard id: ${candyGuardPkStr}`);
    }

    // Synchronizes the guards config with the on-chain account
    await metaplex.candyMachines().updateCandyGuard({
      candyGuard: candyGuardPk,
      guards: configData.guards.default,
      groups: configData.guards.groups ?? undefined,
    });
  }

  term.println(`\nCandy guard ID: ${candyGuardPk.toBase58()}`);

  // Wrap the candy machine
  term.println(`\n[3/3] ${Emoji.WRAP} Wrapping`);

  const { response } = await metaplex.candyMachines().wrapCandyGuard({
    candyGuard: candyGuardPk,
    candyMachine: candyMachinePk,
    candyGuardAuthority: metaplex.identity(),
    candyMachineAuthority: metaplex.identity(),
  });

  term.println(`Signature: ${response.signature}`);
  term.println(
    "\nThe candy guard is now the mint authority of the candy machine."
  );

  // If we created a new candy guard from the candy machine on the cache file,
  // we store the reference of the candy guard on the cache
  if (cache) {
    cache.program.candyGuard = candyGuardPk.toBase58();
    await cache.syncFile();
  }
};
