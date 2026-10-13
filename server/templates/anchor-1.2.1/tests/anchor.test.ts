import * as anchor from "@anchor-lang/core";
import { assert } from "chai";
import type { MyProgram } from "../target/types/my_program";

describe("My Program", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program: anchor.Program<MyProgram> = anchor.workspace.myProgram;
  const connection = program.provider.connection;

  it("Initializes a new account", async () => {
    // Generate a keypair for the new account
    const myAccountKp = anchor.web3.Keypair.generate();

    // Send transaction
    const data = new anchor.BN(42);
    const txHash = await program.methods
      .initialize(data)
      .accounts({
        myAccount: myAccountKp.publicKey,
        // Omit the `signer` account; it's always the current wallet in tests
        // Omit the `systemProgram` account; all programs are resolved automatically
      })
      .signers([myAccountKp])
      .rpc();
    console.log(`Use "solana confirm -v ${txHash}" to see the logs`);

    // Confirm transaction
    await connection.confirmTransaction(txHash);

    // Fetch the initialized account
    const myAccount = await program.account.myAccount.fetch(
      myAccountKp.publicKey
    );
    console.log("On-chain data is:", myAccount.data.toString());

    // Check whether the data on-chain is equal to the local `data`
    assert(myAccount.data.eq(data));
  });
});
