// No imports needed: web3, anchor, pg and more are globally available

describe("Test", () => {
  it("Initlialize", async () => {
    const [newGameDataAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("level1", "utf8")],
      pg.program.programId
    );

    // If account is null we initialize
    try {
      await pg.program.account.gameDataAccount.fetch(newGameDataAccount);
    } catch {
      const txHash = await pg.program.methods
        .initialize()
        .accounts({
          newGameDataAccount: newGameDataAccount,
          signer: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([pg.wallet.keypair])
        .rpc();

      console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
      await pg.connection.confirmTransaction(txHash);
    }
  });

  it("RunningRight", async () => {
    const [newGameDataAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("level1", "utf8")],
      pg.program.programId
    );

    for (let i = 0; i < 3; i++) {
      const txHash = await pg.program.methods
        .moveRight()
        .accounts({
          gameDataAccount: newGameDataAccount,
        })
        .signers([pg.wallet.keypair])
        .rpc();
      console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
      await pg.connection.confirmTransaction(txHash);
    }

    // Fetch the created account
    const gameDateAccount = await pg.program.account.gameDataAccount.fetch(
      newGameDataAccount
    );

    console.log(
      "Player position is:",
      gameDateAccount.playerPosition.toString()
    );

    // Check whether the data on-chain is equal to local 'data'
    assert(3 == gameDateAccount.playerPosition);
  });

  it("RunningLeft", async () => {
    const [newGameDataAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("level1", "utf8")],
      pg.program.programId
    );

    for (let i = 0; i < 3; i++) {
      const txHash = await pg.program.methods
        .moveLeft()
        .accounts({
          gameDataAccount: newGameDataAccount,
        })
        .rpc();
      console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
      await pg.connection.confirmTransaction(txHash);
    }

    // Fetch the created account
    const gameData = await pg.program.account.gameDataAccount.fetch(
      newGameDataAccount
    );

    console.log("Player position is:", gameData.playerPosition.toString());

    // Check whether the data on-chain is equal to local 'data'
    assert(0 == gameData.playerPosition);
  });
});
