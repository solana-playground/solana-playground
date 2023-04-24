describe("Test", () => {
  it("stacksize", async () => {
    const signer = anchor.web3.Keypair.generate();
    console.log("Local signer is: ", signer.publicKey.toBase58());

    let confirmOptions = {
      skipPreflight: true,
    };

    let [pdaHitStackSize] = await anchor.web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("hit_stack_size"),
        signer.publicKey.toBuffer(),
      ],
      pg.program.programId
    );

    console.log(new Date(), "requesting airdrop");
    const airdropTx = await pg.connection.requestAirdrop(
      signer.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await pg.connection.confirmTransaction(airdropTx);

    try {
      const tx = await pg.program.methods
        .initializeHitStackSize()
        .accounts({
          signer: signer.publicKey,
          dataHolder: pdaHitStackSize,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([signer])
        .rpc(confirmOptions);
      console.log("Hit stack size signature", tx);
    } catch (e) {
      console.log("Error of hitting stack size: ", e);
    }
  });

  it("without_zero_copy", async () => {
    const signer = anchor.web3.Keypair.generate();
    console.log("Local signer is: ", signer.publicKey.toBase58());

    let confirmOptions = {
      skipPreflight: true,
    };

    let [pdaNoZeroCopy] = await anchor.web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("data_holder_no_zero_copy_v0"),
        signer.publicKey.toBuffer(),
      ],
      pg.program.programId
    );

    console.log(new Date(), "requesting airdrop");
    const airdropTx = await pg.connection.requestAirdrop(
      signer.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await pg.connection.confirmTransaction(airdropTx);

    let tx = await pg.program.methods
      .initializeNoZeroCopy()
      .accounts({
        signer: signer.publicKey,
        dataHolderNoZeroCopy: pdaNoZeroCopy,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc(confirmOptions);
    console.log("Initialize transaction", tx);

    const string_length = 920;

    // Max transaction size data size is 1232 Byte minus 32 bytes per account pubkey and instruction disciminator
    // signature 64
    // Blockhash 32
    // 1024 - 32 - 32 - 32 - 8 = 920
    tx = await pg.program.methods
      .increaseAccountData(20480)
      .accounts({
        signer: signer.publicKey,
        dataHolder: pdaNoZeroCopy,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc(confirmOptions);

    console.log("Realloc", tx);

    // Although the account is big (20480Kb) as soon as we put more data we will get an out of memory error since PDA accounts
    // are limited not by the usualy heap size of 32 Kb but 10Kb per PDA. This does not apply for zero copy accounts.
    // for (let counter = 0; counter < 12; counter++) {
    for (let counter = 0; counter < 14; counter++) {
      try {
        const tx = await pg.program.methods
          .setDataNoZeroCopy("A".repeat(string_length))
          .accounts({
            signer: signer.publicKey,
            dataHolder: pdaNoZeroCopy,
          })
          .signers([signer])
          .rpc(confirmOptions);
        console.log("Add more string " + counter, tx);
      } catch (e) {
        console.log("error occurred: ", e);
      }
    }

    pg.connection.getAccountInfo(pdaNoZeroCopy).then((accountInfo) => {
      let counter = 0;
      for (let bytes of accountInfo.data) {
        if (bytes != 0) {
          counter++;
        }
      }
      console.log("Non zero bytes in buffer: " + counter);
    });
  });

  it("Initialize 10kb accounts", async () => {
    const signer = anchor.web3.Keypair.generate();
    console.log("Local signer is: ", signer.publicKey.toBase58());

    let confirmOptions = {
      skipPreflight: true,
    };

    let [pdaZeroCopy] = await anchor.web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("data_holder_zero_copy_v0"),
        signer.publicKey.toBuffer(),
      ],
      pg.program.programId
    );

    console.log(new Date(), "requesting airdrop");
    const airdropTx = await pg.connection.requestAirdrop(
      signer.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await pg.connection.confirmTransaction(airdropTx);

    const tx = await pg.program.methods
      .initializeZeroCopy()
      .accounts({
        signer: signer.publicKey,
        dataHolder: pdaZeroCopy,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc(confirmOptions);
    console.log("Initialize transaction", tx);

    // Fill big account with data above heap size using copy_from_slice in the program
    // We need to increase the space in 10 * 1024 byte steps otherwise we will get an error
    // This will work up to 10Mb
    let reallocTransaction = await pg.program.methods
      .increaseAccountDataZeroCopy(20480)
      .accounts({
        signer: signer.publicKey,
        dataHolder: pdaZeroCopy,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc(confirmOptions);

    reallocTransaction = await pg.program.methods
      .increaseAccountDataZeroCopy(30720)
      .accounts({
        signer: signer.publicKey,
        dataHolder: pdaZeroCopy,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc(confirmOptions);

    reallocTransaction = await pg.program.methods
      .increaseAccountDataZeroCopy(40960)
      .accounts({
        signer: signer.publicKey,
        dataHolder: pdaZeroCopy,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc(confirmOptions);

    pg.connection.getAccountInfo(pdaZeroCopy).then((accountInfo) => {
      console.log("Account size: ", accountInfo.data.length);
    });

    // 1024 - 32 - 32 - 32 - 8 - 8 = 912
    const string_length = 912;
    for (let counter = 0; counter < 43; counter++) {
      try {
        const tx = await pg.program.methods
          .setData(
            "A".repeat(string_length),
            new anchor.BN.BN(string_length * counter)
          )
          .accounts({
            signer: signer.publicKey,
            dataHolder: pdaZeroCopy,
          })
          .signers([signer])
          .rpc(confirmOptions);

        console.log("Add more string " + counter, tx);

        pg.connection.getAccountInfo(pdaZeroCopy).then((accountInfo) => {
          let counter = 0;
          for (let bytes of accountInfo.data) {
            if (bytes != 0) {
              counter++;
            }
          }
          console.log("Non zero bytes in buffer: " + counter);
        });
      } catch (e) {
        console.log("error occurred: ", e);
      }
    }
  });
});
