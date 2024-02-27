describe("Todo App", async () => {
  const task = "ship product";
  const lastTodo = new anchor.BN(0);
  const lastTodoBuffer = lastTodo.toArrayLike(Buffer, "le", 1);

  const [userProfile] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), pg.wallet.publicKey.toBuffer()],
    pg.PROGRAM_ID
  );

  const [todoAccount] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("todo_account"),
      pg.wallet.publicKey.toBuffer(),
      lastTodoBuffer,
    ],
    pg.PROGRAM_ID
  );

  // Init user profile
  it("init", async () => {
    const tx = await pg.program.methods
      .initUserProfile()
      .accounts({
        owner: pg.wallet.publicKey,
        userProfile: userProfile
      })
      .rpc();

    await pg.connection.confirmTransaction(tx);
    console.log(`New user profile created at ${userProfile.toString()}`);
    console.log(`Use 'solana confirm -v ${tx}' to see the logs`);
  });

  // Add task
  it("add todo task", async () => {
    const tx = await pg.program.methods
      .addTask(task)
      .accounts({
        owner: pg.wallet.publicKey,
        userProfile: userProfile,
        todoAccount: todoAccount
      })
      .rpc();

    await pg.connection.confirmTransaction(tx);
    console.log(`New todo task created at ${todoAccount.toString()}`);
    console.log(`Use 'solana confirm -v ${tx}' to see the logs`);
  });

  // Mark task as done
  it("mark todo task as done", async () => {
    const tx = await pg.program.methods
      .markTaskAsDone()
      .accounts({
        owner: pg.wallet.publicKey,
        todoAccount: todoAccount,
      })
      .rpc();

    await pg.connection.confirmTransaction(tx);
    console.log(`Todo task ${todoAccount.toString()} marked as done.`);
    console.log(`Use 'solana confirm -v ${tx}' to see the logs`);
  });
});