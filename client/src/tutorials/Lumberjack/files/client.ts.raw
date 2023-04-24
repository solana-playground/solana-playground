// The PDA that holds the player account data
const [playerDataPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
  [Buffer.from("player", "utf8"), pg.wallet.publicKey.toBuffer()],
  pg.program.programId
);
let gameDataAccount;

try {
  gameDataAccount = await pg.program.account.playerData.fetch(playerDataPda);
} catch (e) {
  let txHash = await pg.program.methods
    .initPlayer()
    .accounts({
      player: playerDataPda,
      signer: pg.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log(`New player created.`);
  console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  await pg.connection.confirmTransaction(txHash);
  gameDataAccount = await pg.program.account.playerData.fetch(playerDataPda);
}

console.log(
  "You currently have " +
    gameDataAccount.wood +
    " wood and " +
    gameDataAccount.energy +
    " energy in the on chain account."
);
