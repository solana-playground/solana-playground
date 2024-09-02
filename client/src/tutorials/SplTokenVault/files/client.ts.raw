import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { keypairIdentity, token, Metaplex } from "@metaplex-foundation/js";

const mintAuthority = pg.wallet.keypair;

const decimals = 9;

let [tokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_account_owner_pda")],
  pg.PROGRAM_ID
);

const metaplex = new Metaplex(pg.connection).use(
  keypairIdentity(pg.wallet.keypair)
);

const createdSFT = await metaplex.nfts().createSft({
  uri: "https://shdw-drive.genesysgo.net/AzjHvXgqUJortnr5fXDG2aPkp2PfFMvu4Egr57fdiite/PirateCoinMeta",
  name: "Gold",
  symbol: "GOLD",
  sellerFeeBasisPoints: 100,
  updateAuthority: mintAuthority,
  mintAuthority: mintAuthority,
  decimals: decimals,
  tokenStandard: "Fungible",
  isMutable: true,
});

console.log(
  "Creating semi fungible spl token with address: " + createdSFT.sft.address
);

const mintDecimals = Math.pow(10, decimals);

let mintResult = await metaplex.nfts().mint({
  nftOrSft: createdSFT.sft,
  authority: pg.wallet.keypair,
  toOwner: pg.wallet.keypair.publicKey,
  amount: token(100 * mintDecimals),
});

console.log("Mint to result: " + mintResult.response.signature);

const tokenAccount = await getOrCreateAssociatedTokenAccount(
  pg.connection,
  pg.wallet.keypair,
  createdSFT.mintAddress,
  pg.wallet.keypair.publicKey
);

console.log("tokenAccount: " + tokenAccount.address);
console.log("TokenAccountOwnerPda: " + tokenAccountOwnerPda);

let tokenAccountInfo = await getAccount(pg.connection, tokenAccount.address);
console.log(
  "Owned token amount: " + tokenAccountInfo.amount / BigInt(mintDecimals)
);
let [tokenVault] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_vault"), createdSFT.mintAddress.toBuffer()],
  pg.PROGRAM_ID
);
console.log("VaultAccount: " + tokenVault);

let confirmOptions = {
  skipPreflight: true,
};

let txHash = await pg.program.methods
  .initialize()
  .accounts({
    tokenAccountOwnerPda: tokenAccountOwnerPda,
    vaultTokenAccount: tokenVault,
    senderTokenAccount: tokenAccount.address,
    mintOfTokenBeingSent: createdSFT.mintAddress,
    signer: pg.wallet.publicKey,
  })
  .rpc(confirmOptions);

console.log(`Initialize`);
await logTransaction(txHash);

console.log(`Vault initialized.`);
tokenAccountInfo = await getAccount(pg.connection, tokenAccount.address);
console.log(
  "Owned token amount: " + tokenAccountInfo.amount / BigInt(mintDecimals)
);
tokenAccountInfo = await getAccount(pg.connection, tokenVault);
console.log(
  "Vault token amount: " + tokenAccountInfo.amount / BigInt(mintDecimals)
);

async function logTransaction(txHash) {
  const { blockhash, lastValidBlockHeight } =
    await pg.connection.getLatestBlockhash();

  await pg.connection.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature: txHash,
  });

  console.log(
    `Solana Explorer: https://explorer.solana.com/tx/${txHash}?cluster=devnet`
  );
}