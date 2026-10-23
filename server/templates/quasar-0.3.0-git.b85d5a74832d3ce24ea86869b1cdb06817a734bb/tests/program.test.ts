import * as web3 from "@solana/web3.js";
import { Buffer } from "buffer";

describe("My Program", () => {
  const { connection, wallet, PROGRAM_ID } = pg;

  it("Executes the no-op instruction", async () => {
    const tx = new web3.Transaction().add(
      new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
        data: Buffer.from([0]),
      })
    );
    const latestBlockHash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockHash.blockhash;
    tx.feePayer = wallet.publicKey;
    const signedTx = await wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction({ ...latestBlockHash, signature });
  });
});
