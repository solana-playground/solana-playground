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

import { CandyCache } from "../../utils";
import type { ConfigData } from "../../types";
import { PgWeb3 } from "../../../../utils/pg";

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

  const collectionMintKp = new PgWeb3.Keypair();
  const collectionMintPk = collectionMintKp.publicKey;

  const payer = metaplex.identity().publicKey;

  // Create mint account
  const createMintAccountIx = PgWeb3.SystemProgram.createAccount({
    fromPubkey: payer,
    lamports: await metaplex.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    ),
    newAccountPubkey: collectionMintPk,
    programId: TOKEN_PROGRAM_ID,
    space: MINT_SIZE,
  });

  // Initialize mint
  const initMintIx = await createInitializeMintInstruction(
    collectionMintPk,
    0,
    payer,
    payer
  );

  const ataPk = await getAssociatedTokenAddress(collectionMintPk, payer);

  // Create associated account
  const createAtaIx = await createAssociatedTokenAccountInstruction(
    payer,
    ataPk,
    payer,
    collectionMintPk
  );

  // Mint
  const mintToIx = await createMintToInstruction(
    collectionMintPk,
    ataPk,
    payer,
    1
  );

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

  const tx = new PgWeb3.Transaction().add(
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

  const blockhashInfo = await metaplex.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhashInfo.blockhash;

  await metaplex
    .rpc()
    .sendAndConfirmTransaction(tx, {}, [collectionMintKp, metaplex.identity()]);

  collectionItem.onChain = true;
  cache.program.collectionMint = collectionMintPk.toBase58();
  await cache.syncFile();

  return collectionMintPk;
};
