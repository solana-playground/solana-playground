import { Idl, Program, Provider, BN } from "@project-serum/anchor";
import {
  IdlType,
  IdlTypeArray,
  IdlTypeCOption,
  IdlTypeDef,
  IdlTypeDefined,
  IdlTypeOption,
  IdlTypeVec,
} from "@project-serum/anchor/dist/cjs/idl";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { TxVals } from "../../components/Panels/Side/Right/Test/Function";
import { PgCommon } from "./common";
import { PgProgramInfo } from "./program-info";
import { PgTx } from "./tx";
import { PgWallet } from "./wallet";

export class PgTest {
  static DEFAULT_TYPES: IdlType[] = [
    "bool",
    "bytes",
    "f32",
    "f64",
    "i128",
    "i16",
    "i32",
    "i64",
    "i8",
    "publicKey",
    "string",
    "u128",
    "u16",
    "u32",
    "u64",
    "u8",
  ];

  static getFullType(type: IdlType, idlTypes: IdlTypeDef[]): IdlType {
    if (this.DEFAULT_TYPES.includes(type)) return type;

    if (typeof type === "object") {
      if ((type as IdlTypeOption)?.option) {
        // Option<T>
        const insideType = this.getFullType(
          (type as IdlTypeOption).option,
          idlTypes
        );

        return ("Option<" + insideType + ">") as IdlType;
      } else if ((type as IdlTypeCOption)?.coption) {
        // COption<T>
        const insideType = this.getFullType(
          (type as IdlTypeCOption).coption,
          idlTypes
        );

        return ("COption<" + insideType + ">") as IdlType;
      } else if ((type as IdlTypeDefined)?.defined) {
        // Struct or enum
        const customTypeName = (type as IdlTypeDefined).defined;
        const typeInfo = idlTypes.filter((t) => t.name === customTypeName)[0]
          .type;

        const kind = typeInfo.kind;
        if (kind === "enum") {
          // TODO:
          // const variants = typeInfo.variants;
          // ...
        } else if (kind === "struct") {
          return customTypeName as IdlType;

          // TODO:
          // const struct: Struct = {};

          // for (const field of typeInfo.fields) {
          //   struct[field.name] = this.getFullType(field.type, idlTypes);
          // }

          // const fullType =
          //   customTypeName +
          //   JSON.stringify(struct)
          //     .replace("{", " { ")
          //     .replace("}", " }")
          //     .replaceAll(":", ": ")
          //     .replaceAll(",", ", ")
          //     .replaceAll('"', "");
          // return fullType as IdlType;
        }
      } else if ((type as IdlTypeVec)?.vec) {
        // Vec<T>
        const insideType = this.getFullType((type as IdlTypeVec).vec, idlTypes);

        return ("Vec<" + insideType + ">") as IdlType;
      } else if ((type as IdlTypeArray)?.array) {
        // Array = [<T>; n];
        const array = (type as IdlTypeArray).array;
        const insideType = this.getFullType(array[0], idlTypes);

        return ("[" + insideType + "; " + array[1] + "]") as IdlType;
      }
    }

    return "string";
  }

  // TODO: Implement custom types
  static parse(v: string, type: IdlType) {
    let parsedV;

    if (v === "") throw new Error("Can't be empty");
    if (type === "bool") {
      const isTrue = v === "true";
      const isFalse = v === "false";

      if (isTrue || isFalse) parsedV = isTrue;
      else throw new Error("Invalid bool");
    } else if (type === "f32" || type === "f64") {
      if (PgCommon.isFloat(v)) throw new Error("Invalid float");
      parsedV = parseFloat(v);
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
      if (!PgCommon.isInt(v)) throw new Error("Invalid integer");
      parsedV = parseInt(v);
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
