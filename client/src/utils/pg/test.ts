import { Buffer } from "buffer";
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
import { Seed } from "../../components/Panels/Side/Right/Test/Account";

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
          return (customTypeName + "(Enum)") as IdlType;
          // TODO: Error handling based on variants
          // const variants = typeInfo.variants;
          // ...
        } else if (kind === "struct") {
          return customTypeName as IdlType;

          // TODO: Implement error handling based on properties
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
  static parse(v: string, type: IdlType): any {
    let parsedV;

    if (!type.toString().startsWith("Option") && v === "")
      throw new Error("Can't be empty");
    if (type === "bool") {
      const isTrue = v === "true";
      const isFalse = v === "false";

      if (isTrue || isFalse) parsedV = isTrue;
      else throw new Error("Invalid bool");
    } else if (type === "f32" || type === "f64") {
      if (!PgCommon.isFloat(v)) throw new Error("Invalid float");
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
    else if (type === "bytes") {
      const userArray: Uint8Array = JSON.parse(v);
      const isValid = userArray.every((el) => PgCommon.isInt(el.toString()));
      if (!isValid) throw new Error("Invalid bytes");

      parsedV = Buffer.from(userArray);
    } else if (type === "string") parsedV = v;
    else {
      // Non-default types
      const typeString = type.toString();
      const { insideType, outerType } =
        this.getTypesFromParsedString(typeString);

      // TODO: Implement nested advanced types
      if (!this.DEFAULT_TYPES.includes(insideType as IdlType))
        return JSON.parse(v);

      if (outerType === "Vec") {
        const userArray: string[] = JSON.parse(v);

        parsedV = [];
        for (const el of userArray) {
          parsedV.push(this.parse(el, insideType as IdlType));
        }

        if (!parsedV.length) throw new Error("Invalid vec");
      } else if (outerType === "Option" || outerType === "COption") {
        switch (v.toLowerCase()) {
          case "":
          case "none":
          case "null":
            parsedV = null;
            break;
          default:
            parsedV = this.parse(v, insideType as IdlType);
        }
      } else if (typeString.startsWith("[")) {
        const userArray = JSON.parse(v);
        const columnIndex = typeString.indexOf(";");
        const arrayType = typeString.substring(1, columnIndex);
        const arraySize = +typeString.substring(
          columnIndex + 1,
          typeString.indexOf("]")
        );

        parsedV = [];
        for (const el of userArray) {
          parsedV.push(this.parse(el, arrayType as IdlType));
        }

        // The program will not be able to deserialize if the size of the array is not enough
        if (parsedV.length !== arraySize) throw new Error("Invalid array size");
      } else if (typeString.endsWith("(Enum)")) {
        let parsedV = {};
        if (v.includes("[")) throw new Error("Invalid " + type);

        if (v.includes("{")) parsedV = JSON.parse(v);
        else (parsedV as { [key: string]: {} })[v.toLowerCase()] = {};
      } else {
        // Custom Struct
        parsedV = JSON.parse(v);
        if (typeof parsedV !== "object" || parsedV?.length >= 0)
          throw new Error("Invalid " + type);
      }
    }

    return parsedV;
  }

  static getTypesFromParsedString(str: string) {
    const openIndex = str.indexOf("<");
    const closeIndex = str.lastIndexOf(">");
    const outerType = str.substring(0, openIndex);
    const insideType = str.substring(openIndex + 1, closeIndex);

    return { outerType, insideType };
  }

  static async generateProgramAddressFromSeeds(
    seeds: Seed[],
    programId: PublicKey | string
  ) {
    if (typeof programId !== "object") programId = new PublicKey(programId);

    let buffers = [];
    for (const seed of seeds) {
      let buffer;
      if (seed.type === "string") buffer = Buffer.from(seed.value);
      else buffer = new PublicKey(seed.value).toBuffer();

      buffers.push(buffer);
    }

    return await PublicKey.findProgramAddress(buffers, programId);
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

    // Create method
    const method = program.methods[txVals.name](...argValues);

    // Create instruction
    const ix = await method.accounts(txVals.accs as {}).instruction();

    // Add ix to tx
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
