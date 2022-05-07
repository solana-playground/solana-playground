import { Idl, Program, Provider, BN } from "@project-serum/anchor";
import { IdlType } from "@project-serum/anchor/dist/cjs/idl";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { TxVals } from "../../components/Panels/Side/Right/Test/Function";
import { PgProgramInfo } from "./program-info";
import { PgTx } from "./tx";
import { PgWallet } from "./wallet";

export class PgTest {
  // TODO: More precise validation
  static validate(v: string, type: IdlType) {
    let parsedV;

    if (v === "") throw new Error("Can't be empty");
    if (type === "bool") {
      const isTrue = v === "true";
      const isFalse = v === "false";

      if (isTrue || isFalse) parsedV = isTrue;
      else throw new Error("Invalid bool");
    } else if (type === "f32" || type === "f64") {
      const float = parseFloat(v);
      if (isNaN(float)) throw new Error("Invalid float");
      parsedV = float;
    } else if (
      type === "i128" ||
      type === "i64" ||
      type === "u128" ||
      type === "u64"
    )
      parsedV = new BN(v);
    else if (
      type === "i16" ||
      type === "i32" ||
      type === "i8" ||
      type === "u16" ||
      type === "u32" ||
      type === "u8"
    ) {
      const int = parseFloat(v);
      if (isNaN(int)) throw new Error("Invalid integer");
      parsedV = int;
    } else if (type === "publicKey") parsedV = new PublicKey(v);
    else parsedV = v;

    return parsedV;
  }

  static async test(
    txVals: TxVals,
    idl: Idl,
    conn: Connection,
    wallet: PgWallet | AnchorWallet
  ) {
    const provider = new Provider(conn, wallet, Provider.defaultOptions());

    // Get program pk
    const programPkResult = PgProgramInfo.getPk();
    if (programPkResult.err) throw new Error(programPkResult.err);

    const programPk = programPkResult.programPk!;

    const program = new Program(idl, programPk, provider);

    const tx = new Transaction();

    let argValues = [];
    for (const argName in txVals.args) {
      argValues.push(txVals.args[argName]);
    }

    let method;

    // Currently supports up to 4 args
    if (!argValues.length) {
      method = program.methods[txVals.name]();
    } else if (argValues.length === 1) {
      method = program.methods[txVals.name](argValues[0]);
    } else if (argValues.length === 2) {
      method = program.methods[txVals.name](argValues[0], argValues[1]);
    } else if (argValues.length === 3) {
      method = program.methods[txVals.name](
        argValues[0],
        argValues[1],
        argValues[2]
      );
    } else if (argValues.length === 4) {
      method = program.methods[txVals.name](
        argValues[0],
        argValues[1],
        argValues[2],
        argValues[3]
      );
    }

    if (!method) throw new Error(`${argValues.length} is too many arguments`);

    // Create instruction
    const ix = await method.accounts(txVals.accs as {}).instruction();

    // Add to tx
    tx.add(ix);

    // Add additional signers
    let additionalSigners = [];
    for (const name in txVals.additionalSigners) {
      additionalSigners.push(txVals.additionalSigners[name]);
    }

    const txHash = await PgTx.send(tx, conn, wallet, additionalSigners);
    return txHash;
  }
}
