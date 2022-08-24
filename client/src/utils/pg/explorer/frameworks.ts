import { Files } from "./explorer";

export interface Framework {
  name: string;
  language: "Rust" | "Python";
  src: string;
  files: Files;
  defaultOpenFile: string;
  circleImage?: boolean;
}

export const FRAMEWORKS: Framework[] = [
  {
    name: "Native",
    language: "Rust",
    src: "icons/platforms/solana.png",
    files: [
      [
        "lib.rs",
        `solana_program::declare_id!("11111111111111111111111111111111");`,
      ],
    ],
    defaultOpenFile: "lib.rs",
  },
  {
    name: "Anchor",
    language: "Rust",
    src: "https://www.anchor-lang.com/_next/image?url=%2Flogo.png&w=128&q=80",
    files: [
      [
        "lib.rs",
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
    ],
    defaultOpenFile: "lib.rs",
  },
  {
    name: "Seahorse",
    language: "Python",
    src: "https://pbs.twimg.com/profile_images/1556384244598964226/S3cx06I2_400x400.jpg",
    files: [
      [
        "lib.py",
        `# fizzbuzz
# Built with Seahorse v0.1.6
#
# On-chain, persistent FizzBuzz!

from seahorse.prelude import *

declare_id('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS')

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
    ],
    defaultOpenFile: "lib.py",
    circleImage: true,
  },
];
