// No imports needed: web3, anchor, pg and more are globally available

// The PDA adress everyone will be able to control the character if the interact with your program
const [globalLevel1GameDataAccount, bump] =
  await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("level1", "utf8")],
    //[pg.wallet.publicKey.toBuffer()], <- You could also add the player wallet as a seed, then you would have one instance per player. Need to also change the seed in the rust part
    pg.program.programId
  );

// This is where the program will save the sol reward for the chests and from which the reward will be payed out again
const [chestVaultAccount, chestBump] =
  await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("chestVault", "utf8")],
    pg.program.programId
  );

const CHEST_REWARD = 100000000;
const TRANSACTION_COST = 5000;

describe("Test", () => {
  it("Initlialize", async () => {
    // Initialize level set the player position back to 0 and the caller needs to pay to fill up the chest with sol

    let txHash = await pg.program.methods
      .initializeLevelOne()
      .accounts({
        chestVault: chestVaultAccount,
        newGameDataAccount: globalLevel1GameDataAccount,
        signer: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([pg.wallet.keypair])
      .rpc();

    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
    await pg.connection.confirmTransaction(txHash);
  });

  it("SpawningChestCostsSol", async () => {
    let balanceBefore = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(`My balance before spawning a chest: ${balanceBefore} SOL`);

    let txHash = await pg.program.methods
      .resetLevelAndSpawnChest()
      .accounts({
        chestVault: chestVaultAccount,
        gameDataAccount: globalLevel1GameDataAccount,
        payer: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([pg.wallet.keypair])
      .rpc();

    await pg.connection.confirmTransaction(txHash);

    let balanceAfter = await pg.connection.getBalance(pg.wallet.publicKey);
    console.log(`My balance after spawning a chest: ${balanceAfter} SOL`);

    assert(balanceBefore - CHEST_REWARD - TRANSACTION_COST == balanceAfter);
  });

  it("Move to the right and collect chest", async () => {
    let gameDateAccount;
    let balanceBefore = await pg.connection.getBalance(pg.wallet.publicKey);

    // Here we move to the right three times and collect the chest at the end of the level
    for (let i = 0; i < 3; i++) {
      let txHash = await pg.program.methods
        .moveRight()
        .accounts({
          chestVault: chestVaultAccount,
          gameDataAccount: globalLevel1GameDataAccount,
          systemProgram: web3.SystemProgram.programId,
          player: pg.wallet.publicKey,
        })
        .signers([pg.wallet.keypair])
        .rpc();

      await pg.connection.confirmTransaction(txHash);

      gameDateAccount = await pg.program.account.gameDataAccount.fetch(
        globalLevel1GameDataAccount
      );
    }

    let balanceAfter = await pg.connection.getBalance(pg.wallet.publicKey);

    console.log(
      `Balance before collecting chest: ${balanceBefore} Balance after collecting chest: ${balanceAfter}`
    );
    assert(balanceBefore + CHEST_REWARD - 3 * TRANSACTION_COST == balanceAfter);
    assert(gameDateAccount.playerPosition == 3);
  });
});
