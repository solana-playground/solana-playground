import { ClockworkProvider } from "@clockwork-xyz/sdk";

describe("Bank Simulator", async () => {
  const threadId = "bank_account-1";
  const holderName = "test";
  const balance = 10.0;

  const clockworkProvider = ClockworkProvider.fromAnchorProvider(
    pg.program.provider
  );

  const [bankAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bank_account"), Buffer.from(threadId)],
    pg.program.programId
  );

  const [threadAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("authority")],
    pg.program.programId
  );
  const [threadAddress] = clockworkProvider.getThreadPDA(
    threadAuthority,
    threadId
  );

  console.log("Thread ID: ", threadId);
  console.log("Bank Account: ", bankAccount.toBase58());
  console.log("Thread Authority: ", threadAuthority.toBase58());
  console.log("Thread Address: ", threadAddress.toBase58());
  console.log(
    "Clockwork Program: ",
    clockworkProvider.threadProgram.programId.toBase58()
  );

  it("Create Account", async () => {
    await pg.program.methods
      .initializeAccount(
        Buffer.from(threadId),
        holderName,
        Number(balance.toFixed(2))
      )
      .accounts({
        holder: pg.wallet.publicKey,
        bankAccount: bankAccount,
        clockworkProgram: clockworkProvider.threadProgram.programId,
        thread: threadAddress,
        threadAuthority: threadAuthority,
      })
      .rpc();
  });

  it("Deposit Amount", async () => {
    await pg.program.methods
      .deposit(Buffer.from(threadId), balance)
      .accounts({
        bankAccount: bankAccount,
        holder: pg.wallet.publicKey,
      })
      .rpc();
  });

  it("Withdraw Amount", async () => {
    await pg.program.methods
      .withdraw(Buffer.from(threadId), balance)
      .accounts({
        bankAccount: bankAccount,
        holder: pg.wallet.publicKey,
      })
      .rpc();
  });

  it("Delete Account", async () => {
    await pg.program.methods
      .removeAccount(Buffer.from(threadId))
      .accounts({
        holder: pg.wallet.publicKey,
        bankAccount: bankAccount,
        thread: threadAddress,
        threadAuthority: threadAuthority,
        clockworkProgram: clockworkProvider.threadProgram.programId,
      })
      .rpc();
  });
});
