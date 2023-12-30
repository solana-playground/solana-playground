import {
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@coral-xyz/anchor/dist/cjs/utils/token";
import {
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

import type {
  GeneratableInstruction,
  InstructionValueGenerator,
} from "./generator";
import type { IdlAccount, IdlInstruction } from "./idl-types";
import type { OrString } from "../types";

/**
 * Create a generatable instruction from the given IDL instruction.
 *
 * @param idlIx IDL instruction
 * @returns the generatable instruction
 */
export const createGeneratableInstruction = (
  idlIx: IdlInstruction
): GeneratableInstruction => {
  return {
    name: idlIx.name,
    values: {
      programId: { generator: { type: "Current program" } },
      // TODO: Handle composite accounts?
      accounts: (idlIx.accounts as IdlAccount[]).map((acc) => ({
        ...acc,
        generator: createAccountGenerator(acc),
      })),
      args: idlIx.args.map((arg) => ({
        ...arg,
        generator: { type: "Custom", value: "" },
      })),
    },
  };
};

/**
 * Create an account generator from the given IDL account.
 *
 * @param acc IDL account
 * @returns the account generator
 */
const createAccountGenerator = (acc: IdlAccount): InstructionValueGenerator => {
  // Handle `seeds` feature
  // TODO: Re-evaluate this once Anchor package has proper types for PDA seeds
  // https://github.com/coral-xyz/anchor/issues/2750
  if (acc.pda) {
    return {
      type: "From seed",
      seeds: acc.pda.seeds.map((seed) => {
        switch (seed.kind) {
          case "const":
            return {
              type: seed.type,
              generator: { type: "Custom", value: seed.value },
            };

          case "arg":
            return {
              type: seed.type,
              generator: { type: "Arguments", name: seed.path },
            };

          case "account":
            return {
              type: seed.type,
              generator: { type: "Accounts", name: seed.path },
            };

          default:
            throw new Error(`Unknown seed kind: \`${seed.kind}\``);
        }
      }),
      // TODO: Handle `acc.pda.programId`
      programId: { generator: { type: "Current program" } },
    };
  }

  return {
    type: "Custom",
    value: getKnownAccountKey(acc.name) ?? "",
  };
};

/**
 * Get the public key of known accounts, e.g. `systemProgram`.
 *
 * @param name name of the account
 * @returns account public key as string or empty string if the name is unknown
 */
const getKnownAccountKey = <
  T extends typeof KNOWN_ACCOUNT_KEYS,
  N extends OrString<keyof T>
>(
  name: N
) => {
  return (KNOWN_ACCOUNT_KEYS[name as keyof typeof KNOWN_ACCOUNT_KEYS] ??
    null) as N extends keyof T ? T[N] : string | null;
};

/* Known account name -> account key map */
const KNOWN_ACCOUNT_KEYS = {
  systemProgram: SystemProgram.programId.toBase58(),
  tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
  associatedTokenProgram: ASSOCIATED_PROGRAM_ID.toBase58(),
  tokenMetadataProgram: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  clock: SYSVAR_CLOCK_PUBKEY.toBase58(),
  rent: SYSVAR_RENT_PUBKEY.toBase58(),
} as const;
