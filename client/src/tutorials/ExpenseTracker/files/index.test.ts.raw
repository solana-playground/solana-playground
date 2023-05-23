describe("Expense Tracker", async () => {
  let merchantName = "test";
  let amount = 100;
  let id = 1;

  let merchantName2 = "test 2";
  let amount2 = 200;

  let [expense_account] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("expense"),
      pg.wallet.publicKey.toBuffer(),
      new BN(id).toArrayLike(Buffer, "le", 8),
    ],
    pg.program.programId
  );

  it("Initialize Expense", async () => {
    await pg.program.methods
      .initializeExpense(new anchor.BN(id), merchantName, new anchor.BN(amount))
      .accounts({
        expenseAccount: expense_account,
        authority: pg.wallet.publicKey,
      })
      .rpc();
  });

  it("Modify Expense", async () => {
    await pg.program.methods
      .modifyExpense(new anchor.BN(id), merchantName2, new anchor.BN(amount2))
      .accounts({
        expenseAccount: expense_account,
        authority: pg.wallet.publicKey,
      })
      .rpc();
  });

  it("Delete Expense", async () => {
    await pg.program.methods
      .deleteExpense(new anchor.BN(id))
      .accounts({
        expenseAccount: expense_account,
        authority: pg.wallet.publicKey,
      })
      .rpc();
  });
});
