import { Metaplex } from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

import { Emoji } from "../../../../../../constants";
import { PgConnection } from "../../../../connection";
import { PgTerminal } from "../../../../terminal";
import {
  getCmCreatorMetadataAccounts,
  getMetaplex,
  loadCache,
} from "../../utils";

export const processSign = async (
  rpcUrl: string = PgConnection.endpoint,
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
        .metadata({ mint: new PublicKey(mint) })
    );
  } else {
    term.println(`\n[2/3] ${Emoji.LOOKING_GLASS} Fetching mint ids`);

    const candyMachinePkStr =
      candyMachineId ?? (await loadCache()).program.candyMachine;

    const metadataAccounts = await getCmCreatorMetadataAccounts(
      metaplex,
      metaplex.identity().publicKey.toBase58(),
      1
    );

    if (!metadataAccounts.length) {
      throw new Error(
        `No NFTs found for candy machine id ${candyMachinePkStr}.`
      );
    } else {
      term.println(`Found ${metadataAccounts.length} account(s)`);
      term.println(`\n[3/3] ${Emoji.SIGNING} Signing mint accounts`);
    }

    const errors = [];
    for (const metadataAccount of metadataAccounts) {
      try {
        await sign(metaplex, new PublicKey(metadataAccount.data.slice(33, 65)));
      } catch (e: any) {
        errors.push(e.message);
      }
    }

    if (errors.length) {
      console.log(errors);
      throw new Error(
        `Failed to sign ${errors.length}/${metadataAccounts.length} NFTs.`
      );
    }

    term.println(PgTerminal.success("All NFTs signed successfully."));
  }
};

const sign = async (metaplex: Metaplex, mintPk: PublicKey) => {
  await metaplex.nfts().verifyCreator({ mintAddress: mintPk });
};
