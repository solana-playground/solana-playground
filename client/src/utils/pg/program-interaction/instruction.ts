import { getPrograms } from "./generators";
import { getIdlType, Idl, IdlAccount, IdlInstruction } from "./idl-types";
import { PgWeb3 } from "../web3";
import type {
  GeneratableInstruction,
  InstructionValueGenerator,
} from "./generator";
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
 * Fill empty values of the given generatable instruction with "Random"
 * generators.
 *
 * @param ix generatable instruction
 * @param idl IDL
 * @returns the instruction with empty values filled with "Random" generator
 */
export const fillRandom = (
  ix: GeneratableInstruction,
  idl: Idl
): GeneratableInstruction => ({
  ...ix,
  values: {
    ...ix.values,
    accounts: ix.values.accounts.map((acc) => {
      // Only override empty fields
      if (acc.generator.type === "Custom" && !acc.generator.value) {
        return {
          ...acc,
          generator: {
            type: "Random",
            data: Array.from(PgWeb3.Keypair.generate().secretKey),
            get value() {
              return PgWeb3.Keypair.fromSecretKey(
                Uint8Array.from((this as { data: number[] }).data)
              ).publicKey.toBase58();
            },
          },
        };
      }

      return acc;
    }),
    args: ix.values.args.map((arg) => {
      // Only override empty fields
      if (arg.generator.type === "Custom" && !arg.generator.value) {
        return {
          ...arg,
          generator: {
            type: "Random",
            value: getIdlType(arg.type, idl).generateRandom(),
          },
        };
      }

      return arg;
    }),
  },
});

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

  // Set common wallet account names to current wallet
  const COMMON_WALLET_ACCOUNT_NAMES = ["authority", "owner", "payer", "signer"];
  if (acc.isSigner && COMMON_WALLET_ACCOUNT_NAMES.includes(acc.name)) {
    return { type: "Current wallet" };
  }

  // Check whether it's a known program
  const knownProgram = getPrograms().find((p) => p.alias?.includes(acc.name));
  if (knownProgram) return { type: "All programs", name: knownProgram.name };

  return { type: "Custom", value: getKnownAccountKey(acc.name) ?? "" };
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
// TODO: Add sysvar generator
const KNOWN_ACCOUNT_KEYS = {
  clock: PgWeb3.SYSVAR_CLOCK_PUBKEY.toBase58(),
  rent: PgWeb3.SYSVAR_RENT_PUBKEY.toBase58(),
} as const;
