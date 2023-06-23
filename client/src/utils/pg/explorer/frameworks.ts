import type { TupleFiles } from "./types";

export enum Lang {
  RUST = "Rust",
  PYTHON = "Python",
  JAVASCRIPT = "JavaScript",
  TYPESCRIPT = "TypeScript",
  JAVASCRIPT_TEST = "JavaScript Test",
  TYPESCRIPT_TEST = "TypeScript Test",
  JSON = "JSON",
}

export interface Framework {
  name: string;
  language: Lang;
  src: string;
  files: TupleFiles;
  defaultOpenFile?: string;
  circleImage?: boolean;
}

export const FRAMEWORKS: Framework[] = [
  {
    name: "Native",
    language: Lang.RUST,
    src: "/icons/platforms/solana.png",
    files: [
      [
        "src/lib.rs",
        `use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    /// number of greetings
    pub counter: u32,
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    msg!("Hello World Rust program entrypoint");

    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Increment and store the number of times the account has been greeted
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
    greeting_account.counter += 1;
    greeting_account.serialize(&mut *account.data.borrow_mut())?;

    msg!("Greeted {} time(s)!", greeting_account.counter);

    Ok(())
}`,
      ],
      [
        "client/client.ts",
        `// Client
console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(\`My balance: \${balance / web3.LAMPORTS_PER_SOL} SOL\`);
`,
      ],
      [
        "tests/native.test.ts",
        `// No imports needed: web3, borsh, pg and more are globally available

/**
 * The state of a greeting account managed by the hello world program
 */
class GreetingAccount {
  counter = 0;
  constructor(fields: { counter: number } | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

/**
 * Borsh schema definition for greeting accounts
 */
const GreetingSchema = new Map([
  [GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
]);

/**
 * The expected size of each greeting account.
 */
const GREETING_SIZE = borsh.serialize(
  GreetingSchema,
  new GreetingAccount()
).length;

describe("Test", () => {
  it("greet", async () => {
    // Create greetings account instruction
    const greetingAccountKp = new web3.Keypair();
    const lamports = await pg.connection.getMinimumBalanceForRentExemption(
      GREETING_SIZE
    );
    const createGreetingAccountIx = web3.SystemProgram.createAccount({
      fromPubkey: pg.wallet.publicKey,
      lamports,
      newAccountPubkey: greetingAccountKp.publicKey,
      programId: pg.PROGRAM_ID,
      space: GREETING_SIZE,
    });

    // Create greet instruction
    const greetIx = new web3.TransactionInstruction({
      keys: [
        {
          pubkey: greetingAccountKp.publicKey,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: pg.PROGRAM_ID,
    });

    // Create transaction and add the instructions
    const tx = new web3.Transaction();
    tx.add(createGreetingAccountIx, greetIx);

    // Send and confirm the transaction
    const txHash = await web3.sendAndConfirmTransaction(pg.connection, tx, [
      pg.wallet.keypair,
      greetingAccountKp,
    ]);
    console.log(\`Use 'solana confirm -v \${txHash}' to see the logs\`);

    // Fetch the greetings account
    const greetingAccount = await pg.connection.getAccountInfo(
      greetingAccountKp.publicKey
    );

    // Deserialize the account data
    const deserializedAccountData = borsh.deserialize(
      GreetingSchema,
      GreetingAccount,
      greetingAccount.data
    );

    // Assertions
    assert.equal(greetingAccount.lamports, lamports);

    assert(greetingAccount.owner.equals(pg.PROGRAM_ID));

    assert.deepEqual(greetingAccount.data, Buffer.from([1, 0, 0, 0]));

    assert.equal(deserializedAccountData.counter, 1);
  });
});
`,
      ],
    ],
  },
  {
    name: "Anchor",
    language: Lang.RUST,
    src: "https://www.anchor-lang.com/_next/image?url=%2Flogo.png&w=128&q=80",
    files: [
      [
        "src/lib.rs",
        `use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("11111111111111111111111111111111");

#[program]
mod hello_anchor {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        ctx.accounts.new_account.data = data;
        msg!("Changed data to: {}!", data); // Message will show up in the tx logs
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // We must specify the space in order to initialize an account.
    // First 8 bytes are default account discriminator,
    // next 8 bytes come from NewAccount.data being type u64.
    // (u64 = 64 bits unsigned integer = 8 bytes)
    #[account(init, payer = signer, space = 8 + 8)]
    pub new_account: Account<'info, NewAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NewAccount {
    data: u64
}`,
      ],
      [
        "client/client.ts",
        `// Client
console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(\`My balance: \${balance / web3.LAMPORTS_PER_SOL} SOL\`);
`,
      ],
      [
        "tests/anchor.test.ts",
        `// No imports needed: web3, anchor, pg and more are globally available

describe("Test", () => {
  it("initialize", async () => {
    // Generate keypair for the new account
    const newAccountKp = new web3.Keypair();

    // Send transaction
    const data = new BN(42);
    const txHash = await pg.program.methods
      .initialize(data)
      .accounts({
        newAccount: newAccountKp.publicKey,
        signer: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([newAccountKp])
      .rpc();
    console.log(\`Use 'solana confirm -v \${txHash}' to see the logs\`);

    // Confirm transaction
    await pg.connection.confirmTransaction(txHash);

    // Fetch the created account
    const newAccount = await pg.program.account.newAccount.fetch(
      newAccountKp.publicKey
    );

    console.log("On-chain data is:", newAccount.data.toString());

    // Check whether the data on-chain is equal to local 'data'
    assert(data.eq(newAccount.data));
  });
});
`,
      ],
    ],
  },
  {
    name: "Seahorse",
    language: Lang.PYTHON,
    src: "https://pbs.twimg.com/profile_images/1556384244598964226/S3cx06I2_400x400.jpg",
    files: [
      [
        "src/fizzbuzz.py",
        `# fizzbuzz
# Built with Seahorse v0.2.7
#
# On-chain, persistent FizzBuzz!

from seahorse.prelude import *

# This is your program's public key and it will update
# automatically when you build the project.
declare_id('11111111111111111111111111111111')

class FizzBuzz(Account):
  fizz: bool
  buzz: bool
  n: u64

@instruction
def init(owner: Signer, fizzbuzz: Empty[FizzBuzz]):
  fizzbuzz.init(payer = owner, seeds = ['fizzbuzz', owner])

@instruction
def do_fizzbuzz(fizzbuzz: FizzBuzz, n: u64):
  fizzbuzz.fizz = n % 3 == 0
  fizzbuzz.buzz = n % 5 == 0
  if not fizzbuzz.fizz and not fizzbuzz.buzz:
    fizzbuzz.n = n
  else:
    fizzbuzz.n = 0`,
      ],
      [
        "client/client.ts",
        `// Client
console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(\`My balance: \${balance / web3.LAMPORTS_PER_SOL} SOL\`);
`,
      ],
      [
        "tests/seahorse.test.ts",
        `// No imports needed: web3, anchor, pg and more are globally available

describe("Test", async () => {
  // Generate the fizzbuzz account public key from its seeds
  const [fizzBuzzAccountPk] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("fizzbuzz"), pg.wallet.publicKey.toBuffer()],
    pg.PROGRAM_ID
  );

  it("init", async () => {
    // Send transaction
    const txHash = await pg.program.methods
      .init()
      .accounts({
        fizzbuzz: fizzBuzzAccountPk,
        owner: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
      console.log(\`Use 'solana confirm -v \${txHash}' to see the logs\`);

    // Confirm transaction
    await pg.connection.confirmTransaction(txHash);

    // Fetch the created account
    const fizzBuzzAccount = await pg.program.account.fizzBuzz.fetch(
      fizzBuzzAccountPk
    );

    console.log("Fizz:", fizzBuzzAccount.fizz);
    console.log("Buzz:", fizzBuzzAccount.buzz);
    console.log("N:", fizzBuzzAccount.n.toString());
  });

  it("doFizzbuzz", async () => {
    // Send transaction
    const txHash = await pg.program.methods
      .doFizzbuzz(new BN(6000))
      .accounts({
        fizzbuzz: fizzBuzzAccountPk,
      })
      .rpc();

    // Confirm transaction
    await pg.connection.confirmTransaction(txHash);

    // Fetch the fizzbuzz account
    const fizzBuzzAccount = await pg.program.account.fizzBuzz.fetch(
      fizzBuzzAccountPk
    );

    console.log("Fizz:", fizzBuzzAccount.fizz);
    assert(fizzBuzzAccount.fizz)

    console.log("Buzz:", fizzBuzzAccount.buzz);
    assert(fizzBuzzAccount.buzz)

    console.log("N:", fizzBuzzAccount.n.toString());
    assert.equal(fizzBuzzAccount.n, 0);
  });
});
`,
      ],
    ],
    circleImage: true,
  },
];
