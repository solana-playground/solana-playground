import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Etracker } from "../target/types/etracker";

describe("etracker", async() => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.local();

  const program = anchor.workspace.Etracker as Program<Etracker>;

  const wallet = provider.wallet as anchor.Wallet;

  let mname = "test";
  let mamount = 100;

  let mname2 = "test2";
  let mamount2 = 200;

  let [expense_account,vPDA1] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("expense"), wallet.publicKey.toBuffer(), Buffer.from("1")],
    program.programId
  );

  it("Initialize Expense", async () => {
    // Add your test here.

    const tx = await program.methods.initializeExpense(
      "1",
      mname,
      new anchor.BN(mamount)
    ).accounts({
      expenseAccount: expense_account,
      authority: wallet.publicKey,
    })
    .rpc();

    let dt = await program.account.expenseAccount.fetch(expense_account);
    await console.log(dt)

  });

  it("Modify Expense", async () => {
    // Add your test here.

    const tx = await program.methods.modifyExpense(
      "1",
      mname2,
      new anchor.BN(mamount2)
    ).accounts({
      expenseAccount: expense_account,
      authority: wallet.publicKey,
    })
    .rpc();

    let dt = await program.account.expenseAccount.fetch(expense_account);
    await console.log(dt)

  });

  it("Delete Expense", async () => {

    const tx = await program.methods.deleteExpense(
      "1"
    ).accounts({
      expenseAccount: expense_account,
      authority: wallet.publicKey,
    })
    .rpc();


  });


});
