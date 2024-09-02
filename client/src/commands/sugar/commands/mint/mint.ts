import { toBigNumber } from "@metaplex-foundation/js";

import { getMetaplex, loadCache } from "../../utils";
import { Emoji } from "../../../../constants";
import { PgBlockExplorer, PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processMint = async (
  rpcUrl: string | undefined,
  number: bigint | undefined,
  receiver: string | undefined,
  candyMachine: string | undefined
) => {
  const metaplex = await getMetaplex(rpcUrl);

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

  term.println(`\n[2/2] ${Emoji.CANDY} Minting from candy machine`);

  const receiverPk = receiver
    ? new PgWeb3.PublicKey(receiver)
    : metaplex.identity().publicKey;
  term.println(`Minting to ${receiverPk.toBase58()}\n`);

  const mintAmount = toBigNumber(number?.toString() ?? 1);
  const available = candyState.itemsRemaining;

  if (mintAmount.gt(available) || mintAmount.eqn(0)) {
    throw new Error(`${available} item(s) available, requested ${mintAmount}`);
  }

  // Show progress bar
  PgTerminal.setProgress(0.1);
  let progressCount = 0;

  // Check for candy guard groups
  const groupLen = candyState.candyGuard?.groups.length;
  let groupIndex = 0;
  if (groupLen && groupLen > 1) {
    groupIndex = await term.waitForUserInput(
      "Candy guard has multiple groups. Which group do you belong to?",
      {
        choice: {
          items: candyState.candyGuard.groups.map((g) => g.label),
        },
      }
    );
  }
  // Need to specify the group label when we are minting if guards have groups
  const group = groupLen
    ? candyState.candyGuard.groups[groupIndex].label
    : null;

  const CONCURRENT = 4;
  const errors: string[] = [];
  let isMintingOver = false;

  const logCondition = mintAmount.ltn(100);

  await Promise.all(
    new Array(CONCURRENT).fill(null).map(async (_, i) => {
      for (let j = 0; mintAmount.gtn(j + i); j += CONCURRENT) {
        try {
          const { nft } = await candyClient.mint({
            candyMachine: {
              address: candyState.address,
              collectionMintAddress: candyState.collectionMintAddress,
              candyGuard: candyState.candyGuard,
            },
            collectionUpdateAuthority: candyState.authorityAddress,
            group,
          });

          if (logCondition) {
            term.println(
              PgTerminal.secondary(
                `${Emoji.CONFETTI} Minted ${
                  candyState.itemSettings.type === "hidden"
                    ? "NFT"
                    : `${nft.name}`
                }: ${PgTerminal.underline(
                  // The explorer URL will be based on the current cluster
                  // rather than the cluster of the custom URL argument
                  PgBlockExplorer.current.getAddressUrl(nft.address.toBase58())
                )} `
              )
            );
          }
        } catch (e: any) {
          errors.push(e.message);
          // Check if the mint is over
          const newCandyState = await candyClient.findByAddress({
            address: candyState.address,
          });
          if (newCandyState.itemsRemaining.eqn(0)) {
            isMintingOver = true;
            break;
          }
        } finally {
          progressCount++;
          PgTerminal.setProgress((progressCount / mintAmount.toNumber()) * 100);
        }
      }
    })
  );

  // Hide progress bar
  setTimeout(() => PgTerminal.setProgress(0), 1000);

  if (isMintingOver) {
    term.println(PgTerminal.info("Minting is over!"));
  }

  if (errors.length) {
    term.println(
      `${PgTerminal.error("Minted")} ${mintAmount
        .subn(errors.length)
        .toString()}/${mintAmount} ${PgTerminal.error("of the items.")}`
    );

    throw new Error(errors[0]);
  }
};
