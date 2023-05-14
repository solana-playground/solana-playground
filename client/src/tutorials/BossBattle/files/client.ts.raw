const [enemyBossPDA] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("boss")],
  pg.program.programId
);

async function confirmAndLogTransaction(txHash) {
  const { blockhash, lastValidBlockHeight } =
    await pg.connection.getLatestBlockhash();

  await pg.connection.confirmTransaction(
    {
      blockhash,
      lastValidBlockHeight,
      signature: txHash,
    },
    "confirmed"
  );

  console.log(
    `Solana Explorer: https://explorer.solana.com/tx/${txHash}?cluster=devnet`
  );
}

async function respawnEnemyBoss() {
  console.log("Respawning Enemy Boss");
  const tx = await pg.program.methods
    .respawn()
    .accounts({
      enemyBoss: enemyBossPDA,
      player: pg.wallet.publicKey,
    })
    .rpc();
  await confirmAndLogTransaction(tx);

  const enemyBossData = await pg.program.account.enemyBoss.fetch(enemyBossPDA);
  console.log("Enemy Health: ", enemyBossData.health.toNumber() + "\n");
}

async function attackLoop() {
  let enemyBossData;

  try {
    do {
      console.log("Attacking Enemy Boss");
      const tx = await pg.program.methods
        .attack()
        .accounts({
          enemyBoss: enemyBossPDA,
          player: pg.wallet.publicKey,
        })
        .rpc();
      await confirmAndLogTransaction(tx);

      enemyBossData = await pg.program.account.enemyBoss.fetch(enemyBossPDA);
      console.log("Enemy Health: ", enemyBossData.health.toNumber() + "\n");
    } while (enemyBossData.health.toNumber() >= 0);
  } catch (e) {
    console.log(e.error.errorMessage);
  }
}

await respawnEnemyBoss();
await attackLoop();