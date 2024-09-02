import { IdlType, getIdlType } from "./idl-types";
import { getPrograms, getPythAccounts } from "./generators";
import { PgProgramInfo } from "../program-info";
import { PgWallet } from "../wallet";
import { PgWeb3 } from "../web3";

/**
 * Generatable instruction, i.e. the values of the instruction can be derived
 * from its generators.
 *
 * The reason why the values are generated via generators rather than saving
 * the plain value is, the values should change when how they are generated
 * change, e.g. if a public key is generated via "Current wallet" generator,
 * the value should update when the current wallet changes.
 */
export interface GeneratableInstruction {
  /** Instruction name */
  name: string;
  /** Instruction values */
  values: {
    /** Generatable program id */
    programId: WithGenerator<ProgramIdGenerator>;
    /** Generatable instruction accounts */
    accounts: Array<
      {
        /** Account name */
        name: string;
        /** Whether the account is mutable */
        isMut: boolean;
        /** Whether the account is a signer */
        isSigner: boolean;
      } & WithGenerator<AccountGenerator>
    >;
    /** Generatable instruction arguments */
    args: Array<
      {
        /** Argument name */
        name: string;
        /** Argument IDL type */
        type: IdlType;
      } & WithGenerator<ArgsGenerator>
    >;
  };
}

/** Common generator definition utility type */
type WithGenerator<T extends { type: string }> = {
  generator: T;
  error?: string | boolean;
};

/** All possible generators for an instruction */
export type InstructionValueGenerator =
  | ProgramIdGenerator
  | AccountGenerator
  | ArgsGenerator;

/** Generators for the program id */
type ProgramIdGenerator = CustomGenerator | RefGenerator | ProgramGenerator;

/** Generators for the accounts */
type AccountGenerator =
  | CustomGenerator
  | RandomGenerator
  | RefGenerator
  | PublicKeyGenerator
  | ProgramGenerator;

/** Generators for the arguments */
type ArgsGenerator =
  | CustomGenerator
  | RandomGenerator
  | RefGenerator
  | PublicKeyGenerator
  | ProgramGenerator;

/**
 * Custom generator, i.e. any user supplied value that doesn't fit the other
 * generator types.
 */
type CustomGenerator = { type: "Custom"; value: string };

/** Random value generator */
type RandomGenerator = { type: "Random"; value: string; data?: any };

/** Reference generators */
type RefGenerator =
  | { type: "Accounts"; name: string }
  | { type: "Arguments"; name: string };

/** Public key generators */
type PublicKeyGenerator =
  | { type: "Current wallet" }
  | { type: "All wallets"; name: string }
  | {
      type: "From seed";
      seeds: Seed[];
      programId: WithGenerator<ProgramGenerator>;
    }
  | { type: "All programs"; name: string }
  | { type: "Pyth"; name: string };

/** Program public key generator */
type ProgramGenerator = { type: "Current program" };

/** Generatable derivation seed */
export type Seed = { type: IdlType; generator: InstructionValueGenerator };

/**
 * Create an instruction value generator.
 *
 * @param selectedItems selected items in search bar
 * @param value search bar input value
 * @returns the created instruction value generator
 */
export const createGenerator = (
  selectedItems: Array<{ label: string; data?: any }>,
  value: string
): InstructionValueGenerator | null => {
  if (!selectedItems.length) return { type: "Custom", value };

  const type = selectedItems[0].label as InstructionValueGenerator["type"];
  switch (type) {
    case "Custom":
      return { type, value };

    case "Random":
      return { type, value, data: selectedItems[0].data };

    case "Current wallet":
    case "Current program":
      return { type };

    case "All wallets":
    case "All programs":
    case "Pyth":
    case "Accounts":
    case "Arguments":
      if (selectedItems.length !== 2) return null;
      return { type, name: selectedItems[1].label };

    case "From seed":
      if (selectedItems.length !== 2) return null;
      return { type, ...selectedItems[1].data };

    default: {
      // Default non-standard types to "Custom", e.g. `false`
      return { type: "Custom", value };
    }
  }
};

/**
 * Generate the value from the given generator.
 *
 * @param generator generator
 * @param values generatable instruction values
 * @returns the generatable value
 */
export const generateValue = (
  generator: InstructionValueGenerator,
  values: GeneratableInstruction["values"]
): string => {
  switch (generator.type) {
    case "Custom":
    case "Random":
      return generator.value;

    case "Current wallet":
      return PgWallet.current!.publicKey.toBase58();

    case "All wallets": {
      const walletAcc = PgWallet.accounts.find(
        (acc) => acc.name === generator.name
      )!;
      return PgWallet.createWallet(walletAcc).publicKey.toBase58();
    }

    case "From seed":
      return generateProgramAddressFromSeeds(
        generator.seeds,
        generateValue(generator.programId.generator, values),
        values
      ).toBase58();

    case "Current program":
      return PgProgramInfo.getPkStr()!;

    case "All programs":
      return getPrograms().find((p) => p.name === generator.name)!.programId;

    case "Pyth":
      return getPythAccounts()[generator.name];

    case "Accounts": {
      const accRef = values.accounts.find(
        (acc) => acc.name === generator.name
      )!;
      return generateValue(accRef.generator, values);
    }

    case "Arguments": {
      const argRef = values.args.find((arg) => arg.name === generator.name)!;
      return generateValue(argRef.generator, values);
    }
  }
};

/**
 * Generate program derived address.
 *
 * @param seeds derivation seeds
 * @param programId program's public key
 * @param values generatable instruction values
 * @returns the program address derived from the given seeds
 */
export const generateProgramAddressFromSeeds = (
  seeds: Seed[],
  programId: PgWeb3.PublicKey | string,
  values: GeneratableInstruction["values"]
) => {
  if (typeof programId !== "object")
    programId = new PgWeb3.PublicKey(programId);

  const buffers = seeds.map((seed) => {
    const value = generateValue(seed.generator, values);
    const { parse, toBuffer } = getIdlType(seed.type);
    return toBuffer(parse(value));
  });

  return PgWeb3.PublicKey.findProgramAddressSync(buffers, programId)[0];
};
