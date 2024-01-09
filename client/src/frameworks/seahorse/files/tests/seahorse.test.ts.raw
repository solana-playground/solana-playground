// No imports needed: web3, anchor, pg and more are globally available

describe("FizzBuzz", async () => {
  // Generate the fizzbuzz account public key from its seeds
  const [fizzBuzzAccountPk] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("fizzbuzz"), pg.wallet.publicKey.toBuffer()],
    pg.PROGRAM_ID
  );

  it("init", async () => {
    // Send transaction
    const txHash = await pg.program.methods
      .init()
      .accounts({
        fizzbuzz: fizzBuzzAccountPk,
        owner: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
      console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

    // Confirm transaction
    await pg.connection.confirmTransaction(txHash);

    // Fetch the created account
    const fizzBuzzAccount = await pg.program.account.fizzBuzz.fetch(
      fizzBuzzAccountPk
    );

    console.log("Fizz:", fizzBuzzAccount.fizz);
    console.log("Buzz:", fizzBuzzAccount.buzz);
    console.log("N:", fizzBuzzAccount.n.toString());
  });

  it("doFizzbuzz", async () => {
    // Send transaction
    const txHash = await pg.program.methods
      .doFizzbuzz(new BN(6000))
      .accounts({
        fizzbuzz: fizzBuzzAccountPk,
      })
      .rpc();

    // Confirm transaction
    await pg.connection.confirmTransaction(txHash);

    // Fetch the fizzbuzz account
    const fizzBuzzAccount = await pg.program.account.fizzBuzz.fetch(
      fizzBuzzAccountPk
    );

    console.log("Fizz:", fizzBuzzAccount.fizz);
    assert(fizzBuzzAccount.fizz)

    console.log("Buzz:", fizzBuzzAccount.buzz);
    assert(fizzBuzzAccount.buzz)

    console.log("N:", fizzBuzzAccount.n.toString());
    assert.equal(fizzBuzzAccount.n, 0);
  });
});
