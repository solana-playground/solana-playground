import { toBigNumber } from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

import { Emoji } from "../../../../../../constants";
import { PgCommon } from "../../../../common";
import { PgConnection } from "../../../../connection";
import { PgTerminal } from "../../../../terminal";
import { getMetaplex, loadCache } from "../../utils";

export const processMint = async (
  rpcUrl: string = PgConnection.endpoint,
  number: bigint | undefined,
  receiver: string | undefined,
  candyMachine: string | undefined
) => {
  const metaplex = await getMetaplex(rpcUrl);

  // The candy machine id specified takes precedence over the one from the cache
  const candyMachinePkStr =
    candyMachine ?? (await loadCache()).program.candyMachine;
  let candyMachinePk;
  try {
    candyMachinePk = new PublicKey(candyMachinePkStr);
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
    ? new PublicKey(receiver)
    : metaplex.identity().publicKey;
  term.println(`\nMinting to ${receiverPk.toBase58()}`);

  const mintAmount = toBigNumber(number?.toString() ?? 1);
  const available = candyState.itemsRemaining;

  if (mintAmount.gt(available) || mintAmount.eqn(0)) {
    throw new Error(`${available} item(s) available, requested ${mintAmount}`);
  }

  // Show progress bar
  PgTerminal.setProgress(0.1);
  let progressCount = 0;

  const CONCURRENT = 8;
  let errorCount = 0;
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
          });

          if (logCondition) {
            term.println(
              PgTerminal.secondary(
                `${Emoji.CONFETTI} Minted ${
                  candyState.itemSettings.type === "hidden"
                    ? "NFT"
                    : `${nft.name}`
                }: ${PgTerminal.underline(
                  PgCommon.getExplorerTokenUrl(nft.address.toBase58()).explorer
                )} `
              )
            );
          }
        } catch {
          errorCount++;
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

  if (errorCount) {
    term.println(
      `${PgTerminal.error(
        "Some of the items failed to mint."
      )} ${errorCount} items failed.`
    );
    throw new Error(
      `${PgTerminal.error("Minted")} ${mintAmount
        .subn(errorCount)
        .toString()}/${mintAmount} ${PgTerminal.error("of the items")}`
    );
  }
};
