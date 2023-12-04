import { getKnownAccountKey, fetchAccount, fetchAllAccounts } from "./account";
import {
  GeneratableInstruction,
  createGenerator,
  generateValue,
  generateProgramAddressFromSeeds,
} from "./generator";
import { getIdlType } from "./idl-types";
import { getAnchorProgram, getPrograms } from "./programs";
import { PgCommon } from "../common";
import { PgTx } from "../tx";
import { PgWallet } from "../wallet";

export class PgProgramInteraction {
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
        return acc.generator.data;
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

  /** {@link getKnownAccountKey} */
  static getKnownAccountKey = getKnownAccountKey;
}
