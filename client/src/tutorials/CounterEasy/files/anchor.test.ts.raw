describe("counter", () => {
  // Configure the client to use the local cluster.

  const systemProgram = anchor.web3.SystemProgram;

  it("Create Counter!", async () => {
    // Keypair = account
    const [counter, _counterBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [pg.wallet.publicKey.toBytes()],
        pg.program.programId
      );
    console.log("Your counter address", counter.toString());
    const tx = await pg.program.methods
      .createCounter()
      .accounts({
        authority: pg.wallet.publicKey,
        counter: counter,
        systemProgram: systemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Fetch a counter!", async () => {
    // Keypair = account
    const [counterPubkey, _] = await anchor.web3.PublicKey.findProgramAddress(
      [pg.wallet.publicKey.toBytes()],
      pg.program.programId
    );
    console.log("Your counter address", counterPubkey.toString());
    const counter = await pg.program.account.counter.fetch(counterPubkey);
    console.log("Your counter", counter);
  });

  it("Update a counter!", async () => {
    // Keypair = account
    const [counterPubkey, _] = await anchor.web3.PublicKey.findProgramAddress(
      [pg.wallet.publicKey.toBytes()],
      pg.program.programId
    );
    console.log("Your counter address", counterPubkey.toString());
    const counter = await pg.program.account.counter.fetch(counterPubkey);
    console.log("Your counter", counter);
    const tx = await pg.program.methods
      .updateCounter()
      .accounts({
        counter: counterPubkey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    const counterUpdated = await pg.program.account.counter.fetch(counterPubkey);
    console.log("Your counter count is: ", counterUpdated.count.toNumber());
  });
});