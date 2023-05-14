import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Etracker } from "../target/types/etracker";

describe("Expense Tracker", async() => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.local();

  const program = anchor.workspace.Etracker as Program<Etracker>;

  const wallet = provider.wallet as anchor.Wallet;

  let merchant_name = "test";
  let amount = 100;
  let id = "1"

  let merchant_name2 = "test 2";
  let amount2 = 200;

  let [expense_account] = await anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("expense"), wallet.publicKey.toBuffer(), Buffer.from(id)],
    program.programId
  );

  it("Initialize Expense", async () => {

    await program.methods.initializeExpense(
      id,
      merchant_name,
      new anchor.BN(amount)
    ).accounts({
      expenseAccount: expense_account,
      authority: wallet.publicKey,
    })
    .rpc();

    let data = await program.account.expenseAccount.fetch(expense_account);
    console.log(data)

  });

  it("Modify Expense", async () => {
    // Add your test here.

    await program.methods.modifyExpense(
      id,
      merchant_name2,
      new anchor.BN(amount2)
    ).accounts({
      expenseAccount: expense_account,
      authority: wallet.publicKey,
    })
    .rpc();

    let data = await program.account.expenseAccount.fetch(expense_account);
    console.log(data)

  });

  it("Delete Expense", async () => {

    await program.methods.deleteExpense(
      id
    ).accounts({
      expenseAccount: expense_account,
      authority: wallet.publicKey,
    })
    .rpc();

  });


});
