import { fetchAccount, fetchAllAccounts } from "./account";
import {
  GeneratableInstruction,
  createGenerator,
  generateValue,
  generateProgramAddressFromSeeds,
} from "./generator";
import { getPrograms, getOrInitPythAccounts } from "./generators";
import { getIdlType, IdlInstruction } from "./idl-types";
import { createGeneratableInstruction, fillRandom } from "./instruction";
import { getAnchorProgram } from "./program";
import {
  getInstruction,
  resetInstruction,
  saveInstruction,
  syncAllInstructions,
} from "./storage";
import { PgCommon } from "../common";
import { PgTx } from "../tx";
import { PgWallet } from "../wallet";
import { PgWeb3 } from "../web3";

export class PgProgramInteraction {
  /**
   * Get the saved generatable instruction or create a new one if it doesn't
   * exist in storage.
   *
   * @param idlIx IDL instruction
   * @returns the saved or default created generatable instruction
   */
  static getOrCreateInstruction(idlIx: IdlInstruction) {
    const savedIx = getInstruction(idlIx);
    if (savedIx) return savedIx;

    // Not saved, create default
    return createGeneratableInstruction(idlIx);
  }

  /**
   * Send a test transaction to the current program.
   *
   * @param ix generated instruction
   * @returns the transaction hash
   */
  static async test(ix: GeneratableInstruction) {
    const program = getAnchorProgram();

    const args = ix.values.args.map((arg) => {
      const value = generateValue(arg.generator, ix.values);
      const { parse } = getIdlType(arg.type, program.idl);
      return parse(value);
    });

    const accounts = ix.values.accounts.reduce((acc, cur) => {
      acc[cur.name] = generateValue(cur.generator, ix.values);
      return acc;
    }, {} as Record<string, string>);

    const signerAccounts = ix.values.accounts.filter((acc) => acc.isSigner);
    const keypairSigners = signerAccounts
      .map((acc) => {
        if (acc.generator.type !== "Random") return null;
        return PgWeb3.Keypair.fromSecretKey(
          Uint8Array.from(acc.generator.data)
        );
      })
      .filter(PgCommon.isNonNullish);
    const walletSigners = signerAccounts
      .map((acc) => {
        if (acc.generator.type !== "All wallets") return null;

        const generatorName = acc.generator.name;
        const walletAccount = PgWallet.accounts.find(
          ({ name }) => name === generatorName
        )!;
        return PgWallet.createWallet(walletAccount);
      })
      .filter(PgCommon.isNonNullish);

    const tx = await program.methods[ix.name](...args)
      .accounts(accounts)
      .transaction();
    const txHash = await PgTx.send(tx, { keypairSigners, walletSigners });
    return txHash;
  }

  /** {@link createGenerator} */
  static createGenerator = createGenerator;

  /** {@link generateValue} */
  static generateValue = generateValue;

  /** {@link generateProgramAddressFromSeeds} */
  static generateProgramAddressFromSeeds = generateProgramAddressFromSeeds;

  /** {@link getIdlType} */
  static getIdlType = getIdlType;

  /** {@link getPrograms} */
  static getPrograms = getPrograms;

  /** {@link getAnchorProgram} */
  static getAnchorProgram = getAnchorProgram;

  /** {@link fetchAccount} */
  static fetchAccount = fetchAccount;

  /** {@link fetchAllAccounts} */
  static fetchAllAccounts = fetchAllAccounts;

  /** {@link getOrInitPythAccounts} */
  static getOrInitPythAccounts = getOrInitPythAccounts;

  /** {@link fillRandom} */
  static fillRandom = fillRandom;

  /** {@link saveInstruction} */
  static saveInstruction = saveInstruction;

  /** {@link syncAllInstructions} */
  static syncAllInstructions = syncAllInstructions;

  /** {@link resetInstruction} */
  static resetInstruction = resetInstruction;
}
