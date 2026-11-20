import * as web3 from "@solana/web3.js";
import { assert } from "chai";

describe("My Program", () => {
  const { connection, wallet, PROGRAM_ID } = pg;

  it("Logs 'Hello, World!'", async () => {
    const tx = new web3.Transaction().add(
      new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [],
        data: Buffer.from([]),
      })
    );
    const latestBlockHash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockHash.blockhash;
    tx.feePayer = wallet.publicKey;
    const signedTx = await wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction({ ...latestBlockHash, signature });

    const txResult = await connection.getTransaction(signature);
    const { logMessages } = txResult.meta;
    console.log(logMessages);
    assert(logMessages.some((log) => log.includes("Hello, World!")));
  });
});
