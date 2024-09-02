import { createSetCollectionInstruction } from "@metaplex-foundation/mpl-candy-machine-core";

import { hashAndUpdate } from "../hash";
import { processUpdate } from "../update";
import { assertCorrectAuthority, getMetaplex, loadCache } from "../../utils";
import { Emoji } from "../../../../constants";
import { PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processCollectionSet = async (
  rpcUrl: string | undefined,
  candyMachine: string | undefined,
  collectionMint: string
) => {
  // The candy machine id specified takes precedence over the one from the cache
  const candyMachinePkStr =
    candyMachine ?? (await loadCache()).program.candyMachine;
  if (!candyMachinePkStr) {
    throw new Error("Missing candy machine id.");
  }
  let candyMachinePk: PgWeb3.PublicKey;
  try {
    candyMachinePk = new PgWeb3.PublicKey(candyMachinePkStr);
  } catch {
    throw new Error(`Failed to parse candy machine id: ${candyMachinePkStr}`);
  }

  let newCollectionMintPk: PgWeb3.PublicKey;
  try {
    newCollectionMintPk = new PgWeb3.PublicKey(collectionMint);
  } catch {
    throw new Error(`Failed to parse collection mint id: ${candyMachinePkStr}`);
  }

  const term = await PgTerminal.get();
  term.println(`[1/2] ${Emoji.LOOKING_GLASS} Loading candy machine`);
  term.println(`${PgTerminal.bold("Candy machine ID:")} ${candyMachinePkStr}`);

  const metaplex = await getMetaplex(rpcUrl);
  const candyState = await metaplex
    .candyMachines()
    .findByAddress({ address: candyMachinePk });

  const payer = metaplex.identity().publicKey;
  assertCorrectAuthority(payer, candyState.authorityAddress);

  term.println(
    `\n[2/2] ${Emoji.COLLECTION} Setting collection mint for candy machine`
  );

  const getCandyPdas = (collectionMintPk: PgWeb3.PublicKey) => {
    const authorityPda = metaplex
      .candyMachines()
      .pdas()
      .authority({ candyMachine: candyMachinePk });
    const collectionAuthorityRecordPda = metaplex
      .nfts()
      .pdas()
      .collectionAuthorityRecord({
        collectionAuthority: authorityPda,
        mint: collectionMintPk,
      });
    const collectionMetadataPda = metaplex
      .nfts()
      .pdas()
      .metadata({ mint: collectionMintPk });

    return [authorityPda, collectionAuthorityRecordPda, collectionMetadataPda];
  };

  const [authorityPda, collectionAuthorityRecordPda, collectionMetadataPda] =
    getCandyPdas(candyState.collectionMintAddress);
  const [, newCollectionAuthorityRecordPda, newCollectionMetadataPda] =
    getCandyPdas(newCollectionMintPk);
  const newCollectionMasterEditionPda = metaplex
    .nfts()
    .pdas()
    .masterEdition({ mint: newCollectionMintPk });

  const newMetadataInfo = await metaplex
    .nfts()
    .findByMint({ mintAddress: newCollectionMintPk });

  const tx = new PgWeb3.Transaction().add(
    createSetCollectionInstruction({
      candyMachine: candyMachinePk,
      authority: payer,
      authorityPda,
      payer,
      collectionMint: candyState.collectionMintAddress,
      collectionMetadata: collectionMetadataPda,
      collectionAuthorityRecord: collectionAuthorityRecordPda,
      newCollectionUpdateAuthority: newMetadataInfo.updateAuthorityAddress,
      newCollectionMetadata: newCollectionMetadataPda,
      newCollectionMint: newCollectionMintPk,
      newCollectionMasterEdition: newCollectionMasterEditionPda,
      newCollectionAuthorityRecord: newCollectionAuthorityRecordPda,
      tokenMetadataProgram: metaplex.programs().getTokenMetadata().address,
    })
  );
  const blockhashInfo = await metaplex.connection.getLatestBlockhash();
  tx.feePayer = metaplex.identity().publicKey;
  tx.recentBlockhash = blockhashInfo.blockhash;

  await metaplex.rpc().sendAndConfirmTransaction(tx, {}, [metaplex.identity()]);

  // If a candy machine id wasn't manually specified we are operating on the
  // candy machine in the cache, need to update the cache file
  if (!candyMachine) {
    const cache = await loadCache();
    cache.removeItemAtIndex(-1);
    cache.program.collectionMint = newCollectionMintPk.toBase58();
    await cache.syncFile();

    // If hidden settings are enabled, we update the hash value in the config
    // file and update the candy machine on-chain
    if (candyState.itemSettings.type === "hidden") {
      term.println(
        `\n${PgTerminal.bold("Hidden settings hash:")} ${await hashAndUpdate()}`
      );

      term.println(
        "\nCandy machine has hidden settings and cache file was updated. Updating hash value...\n"
      );

      await processUpdate(undefined, undefined, candyMachinePkStr);
    }
  }
};
