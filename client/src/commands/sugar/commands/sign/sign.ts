import { Metaplex } from "@metaplex-foundation/js";

import {
  getCmCreatorMetadataAccounts,
  getMetaplex,
  loadCache,
} from "../../utils";
import { Emoji } from "../../../../constants";
import { PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processSign = async (
  rpcUrl: string | undefined,
  mint: string | undefined,
  candyMachineId: string | undefined
) => {
  const term = await PgTerminal.get();

  // (1) Setting up connection
  term.println(
    `[1/${mint ? "2" : "3"}] ${Emoji.COMPUTER} Initializing connection`
  );

  const metaplex = await getMetaplex(rpcUrl);

  if (mint) {
    term.println(`\n[2/2] ${Emoji.SIGNING} Signing one NFT"`);

    await sign(
      metaplex,
      metaplex
        .nfts()
        .pdas()
        .metadata({ mint: new PgWeb3.PublicKey(mint) })
    );
  } else {
    term.println(`\n[2/3] ${Emoji.LOOKING_GLASS} Fetching mint ids`);

    const candyMachinePkStr =
      candyMachineId ?? (await loadCache()).program.candyMachine;
    let candyMachinePk;
    try {
      candyMachinePk = new PgWeb3.PublicKey(candyMachinePkStr);
    } catch {
      throw new Error(`Failed to parse candy machine id: ${candyMachinePkStr}`);
    }

    const creatorPda = metaplex
      .candyMachines()
      .pdas()
      .authority({ candyMachine: candyMachinePk });

    const metadataAccounts = await getCmCreatorMetadataAccounts(
      metaplex,
      creatorPda.toBase58()
    );

    if (!metadataAccounts.length) {
      throw new Error(
        `No NFTs found for candy machine id ${candyMachinePkStr}.`
      );
    } else {
      term.println(`Found ${metadataAccounts.length} account(s)`);
      term.println(`\n[3/3] ${Emoji.SIGNING} Signing mint accounts`);
    }

    // Show progress bar
    PgTerminal.setProgress(0.1);
    let progressCount = 0;
    let errorCount = 0;

    const CONCURRENT = 4;

    await Promise.all(
      new Array(CONCURRENT).fill(null).map(async (_, i) => {
        for (let j = 0; j + i < metadataAccounts.length; j += CONCURRENT) {
          try {
            await sign(
              metaplex,
              new PgWeb3.PublicKey(metadataAccounts[j + i].data.slice(33, 65))
            );
          } catch (e: any) {
            console.log(e.message);
            errorCount++;
          } finally {
            progressCount++;
            PgTerminal.setProgress(
              (progressCount / metadataAccounts.length) * 100
            );
          }
        }
      })
    );

    // Hide progress bar
    setTimeout(() => PgTerminal.setProgress(0), 1000);

    if (errorCount) {
      throw new Error(
        `Failed to sign ${errorCount}/${metadataAccounts.length} NFTs.`
      );
    }

    term.println(
      PgTerminal.secondary(`${Emoji.CONFETTI} All NFTs signed successfully.`)
    );
  }
};

const sign = async (metaplex: Metaplex, mintPk: PgWeb3.PublicKey) => {
  await metaplex.nfts().verifyCreator({ mintAddress: mintPk });
};
