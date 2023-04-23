import { Metaplex } from "@metaplex-foundation/js";
import { getMint, getAssociatedTokenAddressSync } from "@solana/spl-token";

// metaplex token metadata program ID
const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// metaplex setup
const metaplex = Metaplex.make(pg.connection);

// token metadata
const metadata = {
  uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
  name: "Solana Gold",
  symbol: "GOLDSOL",
};

// reward token mint PDA
const [rewardTokenMintPDA] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("reward")],
  pg.PROGRAM_ID
);

// player data account PDA
const [playerPDA] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("player"), pg.wallet.publicKey.toBuffer()],
  pg.PROGRAM_ID
);

// reward token mint metadata account address
const rewardTokenMintMetadataPDA = await metaplex
  .nfts()
  .pdas()
  .metadata({ mint: rewardTokenMintPDA });

// player token account address
const playerTokenAccount = getAssociatedTokenAddressSync(
  rewardTokenMintPDA,
  pg.wallet.publicKey
);

async function logTransaction(txHash) {
  const { blockhash, lastValidBlockHeight } =
    await pg.connection.getLatestBlockhash();

  await pg.connection.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature: txHash,
  });

  console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
}

async function fetchAccountData() {
  const [playerBalance, playerData] = await Promise.all([
    pg.connection.getTokenAccountBalance(playerTokenAccount),
    pg.program.account.playerData.fetch(playerPDA),
  ]);

  console.log("Player Token Balance: ", playerBalance.value.uiAmount);
  console.log("Player Health: ", playerData.health);
}

let txHash;

try {
  const mintData = await getMint(pg.connection, rewardTokenMintPDA);
  console.log("Mint Already Exists");
} catch {
  txHash = await pg.program.methods
    .createMint(metadata.uri, metadata.name, metadata.symbol)
    .accounts({
      rewardTokenMint: rewardTokenMintPDA,
      metadataAccount: rewardTokenMintMetadataPDA,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .rpc();
  await logTransaction(txHash);
}
console.log("Token Mint: ", rewardTokenMintPDA.toString());

try {
  const playerData = await pg.program.account.playerData.fetch(playerPDA);
  console.log("Player Already Exists");
  console.log("Player Health: ", playerData.health);
} catch {
  txHash = await pg.program.methods
    .initPlayer()
    .accounts({
      playerData: playerPDA,
      player: pg.wallet.publicKey,
    })
    .rpc();
  await logTransaction(txHash);
  console.log("Player Account Created");
}

txHash = await pg.program.methods
  .killEnemy()
  .accounts({
    playerData: playerPDA,
    playerTokenAccount: playerTokenAccount,
    rewardTokenMint: rewardTokenMintPDA,
  })
  .rpc();
await logTransaction(txHash);
console.log("Enemy Defeated");
await fetchAccountData();

txHash = await pg.program.methods
  .heal()
  .accounts({
    playerData: playerPDA,
    playerTokenAccount: playerTokenAccount,
    rewardTokenMint: rewardTokenMintPDA,
  })
  .rpc();
await logTransaction(txHash);
console.log("Player Healed");
await fetchAccountData();