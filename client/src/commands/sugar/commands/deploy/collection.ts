import { Creator, Metaplex } from "@metaplex-foundation/js";
import {
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";

import { CandyCache } from "../../utils";
import type { ConfigData } from "../../types";

export const createCollection = async (
  metaplex: Metaplex,
  cache: CandyCache,
  configData: ConfigData
) => {
  const collectionItem = cache.items["-1"];
  if (!collectionItem) {
    throw new Error(
      "Trying to create and set collection when collection item info isn't in cache! This shouldn't happen!"
    );
  }

  const collectionMintKp = new Keypair();
  const collectionMintPk = collectionMintKp.publicKey;

  const payer = metaplex.identity().publicKey;

  const [
    blockhashInfo,
    [createAtaIx, mintToIx],
    createMintAccountIx,
    initMintIx,
  ] = await Promise.all([
    // Fetch the latest blockhash to use to specify the transaction lifetime
    metaplex.connection.getLatestBlockhash(),
    // Get the [createAta, mintTo] instructions
    (async () => {
      const ataPk = await getAssociatedTokenAddress(collectionMintPk, payer);
      return await Promise.all([
        // Create associated account
        createAssociatedTokenAccountInstruction(
          payer,
          ataPk,
          payer,
          collectionMintPk
        ),
        // Mint
        createMintToInstruction(collectionMintPk, ataPk, payer, 1),
      ]);
    })(),
    // Create mint account
    (async () =>
      SystemProgram.createAccount({
        fromPubkey: payer,
        lamports: await metaplex.connection.getMinimumBalanceForRentExemption(
          MINT_SIZE
        ),
        newAccountPubkey: collectionMintPk,
        programId: TOKEN_PROGRAM_ID,
        space: MINT_SIZE,
      }))(),
    // Initialize mint
    createInitializeMintInstruction(collectionMintPk, 0, payer, payer),
  ]);

  const creator: Creator = {
    address: payer,
    verified: true,
    share: 100,
  };
  const collectionMetadataPk = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: collectionMintPk });

  // Create metadata account
  const createMetadataAccountIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: collectionMetadataPk,
      mint: collectionMintPk,
      mintAuthority: payer,
      payer: payer,
      updateAuthority: payer,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: collectionItem.name,
          symbol: configData.symbol,
          uri: collectionItem.metadata_link,
          creators: [creator],
          sellerFeeBasisPoints: configData.royalties,
          collection: null,
          uses: null,
        },
        collectionDetails: { __kind: "V1", size: 0 },
        isMutable: configData.isMutable,
      },
    }
  );

  const collectionEditionPubkey = metaplex
    .nfts()
    .pdas()
    .masterEdition({ mint: collectionMintPk });

  // Create master edition account
  const createMasterEditionIx = createCreateMasterEditionV3Instruction(
    {
      edition: collectionEditionPubkey,
      mint: collectionMintPk,
      updateAuthority: payer,
      mintAuthority: payer,
      metadata: collectionMetadataPk,
      payer,
    },
    { createMasterEditionArgs: { maxSupply: 0 } }
  );

  const tx = new Transaction().add(
    ...[
      createMintAccountIx,
      initMintIx,
      createAtaIx,
      mintToIx,
      createMetadataAccountIx,
      createMasterEditionIx,
    ]
  );
  tx.feePayer = payer;
  tx.recentBlockhash = blockhashInfo.blockhash;

  await metaplex
    .rpc()
    .sendAndConfirmTransaction(tx, {}, [collectionMintKp, metaplex.identity()]);

  collectionItem.onChain = true;
  cache.program.collectionMint = collectionMintPk.toBase58();
  await cache.syncFile();

  return collectionMintPk;
};
