import { Idl, Program, BN, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Signer, Transaction } from "@solana/web3.js";
import type {
  IdlField,
  IdlType,
  IdlTypeArray,
  IdlTypeCOption,
  IdlTypeDefined,
  IdlTypeOption,
  IdlTypeVec,
} from "@coral-xyz/anchor/dist/cjs/idl";

import { PgCommon } from "../common";
import { PgProgramInfo } from "../program-info";
import { PgTx } from "../tx";
import type { CurrentWallet } from "../wallet";

type KV = {
  [key: string]: string | number | BN | PublicKey | Signer;
};

export interface TxVals {
  name: string;
  additionalSigners: KV;
  accs: KV;
  args: any[];
}

export type Seed = {
  value: string;
  type: IdlType;
};

const DEFAULT_TYPES: IdlType[] = [
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

export class PgTest {
  /**
   * Convert types into string to display in UI
   *
   * @returns the human readable type
   */
  static getFullType(type: IdlType, idl: Idl): IdlType {
    if (DEFAULT_TYPES.includes(type)) return type;

    if (typeof type === "object") {
      if ((type as IdlTypeOption)?.option) {
        // Option<T>
        const innerType = this.getFullType((type as IdlTypeOption).option, idl);

        return ("Option<" + innerType + ">") as IdlType;
      } else if ((type as IdlTypeCOption)?.coption) {
        // COption<T>
        const innerType = this.getFullType(
          (type as IdlTypeCOption).coption,
          idl
        );

        return ("COption<" + innerType + ">") as IdlType;
      } else if ((type as IdlTypeDefined)?.defined) {
        // Struct or enum
        const customTypeName = (type as IdlTypeDefined).defined;

        // Type info might be in 'accounts' instead of 'types'
        let typeInfo = idl.types
          ?.filter((t) => t.name === customTypeName)
          .at(0)?.type;
        if (!typeInfo) {
          typeInfo = idl.accounts?.find((t) => t.name === customTypeName)?.type;
          if (!typeInfo) throw new Error(`Type ${customTypeName} not found`);
        }

        if (typeInfo.kind === "enum") {
          return (customTypeName + "(Enum)") as IdlType;
          // TODO: Error handling based on variants
          // TODO: Show possible enum options
          // const variants = typeInfo.variants;
          // ...
        } else if (typeInfo.kind === "struct") {
          return customTypeName as IdlType;

          // TODO: Implement error handling based on properties
          // const struct: Struct = {};

          // for (const field of typeInfo.fields) {
          //   struct[field.name] = this.getFullType(field.type, idlTypes);
          // }

          // // This shows struct fields instead of the custom struct name
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
      } else if ((type as IdlTypeVec).vec) {
        // Vec<T>
        const innerType = this.getFullType((type as IdlTypeVec).vec, idl);

        return ("Vec<" + innerType + ">") as IdlType;
      } else if ((type as IdlTypeArray).array) {
        // Array = [<T>; n];
        const array = (type as IdlTypeArray).array;
        const innerType = this.getFullType(array[0], idl);

        return ("[" + innerType + "; " + array[1] + "]") as IdlType;
      }
    }

    return "string";
  }

  /**
   * Parse value based on type.
   *
   * This function throws an error if parsing fails.
   *
   * @returns the parsed value
   */
  static parse(v: string, type: IdlType, idl?: Idl): any {
    let parsedV;

    if (!type.toString().startsWith("Option") && v === "") {
      throw new Error("Can't be empty");
    }
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
    ) {
      parsedV = new BN(v);
    } else if (
      type === "i16" ||
      type === "i32" ||
      type === "i8" ||
      type === "u16" ||
      type === "u32" ||
      type === "u8"
    ) {
      if (!PgCommon.isInt(v)) throw new Error("Invalid integer");
      parsedV = parseInt(v);
    } else if (type === "publicKey") {
      parsedV = new PublicKey(v);
    } else if (type === "bytes") {
      const userArray: Uint8Array = JSON.parse(v);
      const isValid = userArray.every((el) => PgCommon.isInt(el.toString()));
      if (!isValid) throw new Error("Invalid bytes");

      parsedV = Buffer.from(userArray);
    } else if (type === "string") {
      parsedV = v;
    } else {
      // Non-default types
      // TODO: Implement nested advanced types
      const typeString = type.toString();
      const { innerType, outerType } =
        this._getTypesFromParsedString(typeString);

      if (outerType === "Vec") {
        const userArray = JSON.parse(v);

        parsedV = [];
        for (const el of userArray) {
          parsedV.push(
            this.parse(JSON.stringify(el), innerType as IdlType, idl)
          );
        }
      } else if (outerType === "Option" || outerType === "COption") {
        switch (v.toLowerCase()) {
          case "":
          case "none":
          case "null":
            parsedV = null;
            break;
          default:
            parsedV = this.parse(v, innerType as IdlType, idl);
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
          parsedV.push(this.parse(el, arrayType as IdlType, idl));
        }

        // The program will not be able to deserialize if the size of the array is not sufficient
        if (parsedV.length !== arraySize) throw new Error("Invalid array size");
      } else if (typeString.endsWith("(Enum)")) {
        // Enum
        if (!idl?.types) {
          throw new Error("Enum requires IDL types to exist");
        }
        if (v.includes("[")) throw new Error("Invalid " + type);

        const enumType = idl.types.find(
          (type) =>
            this.getFullType(type.name as IdlType, idl) ===
            this.getFullType(v as IdlType, idl)
        )?.type;
        if (!enumType) {
          throw new Error(`Type ${type} not found in the IDL`);
        }
        if (enumType.kind !== "enum") {
          throw new Error("IDL type kind must be enum");
        }

        if (v.includes("{")) {
          parsedV = JSON.parse(v);

          // Parse values that needs to be parsed(e.g i64)
          for (const key in parsedV) {
            const variant = enumType.variants.find((variant) => {
              return (
                PgCommon.toCamelCase(variant.name) === PgCommon.toCamelCase(key)
              );
            });
            if (!variant) throw new Error(`Variant ${key} not found`);

            if (variant.fields) {
              for (const _field of variant.fields) {
                const field = _field as IdlField;
                parsedV[key][field.name] = this.parse(
                  typeof parsedV[key][field.name] === "string"
                    ? parsedV[key][field.name]
                    : JSON.stringify(parsedV[key][field.name]),
                  this.getFullType(field.type, idl),
                  idl
                );
              }
            }
          }
        } else {
          const variant = enumType.variants.find(
            (variant) =>
              PgCommon.toCamelCase(variant.name) === PgCommon.toCamelCase(v)
          );
          if (!variant) throw new Error(`Variant ${v} not found`);
          if (variant.fields?.length) {
            throw new Error(
              `Variant ${v} has fields, should use the JSON format`
            );
          }
          parsedV = { [PgCommon.toCamelCase(v)]: {} };
        }
      } else {
        // Custom Struct
        if (!idl?.types) {
          throw new Error("Custom struct requires IDL types to exist");
        }

        const structType = idl.types.find(
          (t) => (t.name as IdlType) === type
        )?.type;
        if (!structType) {
          throw new Error(`Type ${type} not found in the IDL`);
        }
        if (structType.kind !== "struct") {
          throw new Error("IDL type kind must be struct");
        }

        parsedV = JSON.parse(v);
        // Parse values that needs to be parsed(e.g i64)
        for (const field of structType.fields) {
          parsedV[field.name] = this.parse(
            typeof parsedV[field.name] === "string"
              ? parsedV[field.name]
              : JSON.stringify(parsedV[field.name]),
            this.getFullType(field.type, idl),
            idl
          );
        }
      }
    }

    return parsedV;
  }

  /**
   * Generate program address from seed(s) that are not necessarily the same type.
   *
   * @returns [program public key, bump]
   */
  static async generateProgramAddressFromSeeds(
    seeds: Seed[],
    programId: PublicKey | string
  ) {
    if (typeof programId !== "object") programId = new PublicKey(programId);

    let buffers = [];
    for (const seed of seeds) {
      let buffer;
      switch (seed.type) {
        case "string": {
          buffer = Buffer.from(seed.value);
          break;
        }
        case "publicKey": {
          buffer = this.parse(seed.value, seed.type).toBuffer();
          break;
        }
        case "bytes": {
          buffer = Buffer.from(this.parse(seed.value, seed.type));
          break;
        }
        case "u8": {
          buffer = Buffer.from([this.parse(seed.value, seed.type)]);
          break;
        }
        case "u16": {
          buffer = new BN(this.parse(seed.value, seed.type)).toArrayLike(
            Buffer,
            "le",
            2
          );
          break;
        }
        case "u32": {
          buffer = new BN(this.parse(seed.value, seed.type)).toArrayLike(
            Buffer,
            "le",
            4
          );
          break;
        }
        case "u64": {
          buffer = new BN(this.parse(seed.value, seed.type)).toArrayLike(
            Buffer,
            "le",
            8
          );
          break;
        }
        case "u128": {
          buffer = new BN(this.parse(seed.value, seed.type)).toArrayLike(
            Buffer,
            "le",
            16
          );
          break;
        }
        default: {
          buffer = Buffer.from(seed.value);
        }
      }

      buffers.push(buffer);
    }

    return await PublicKey.findProgramAddress(buffers, programId);
  }

  /**
   * @returns Anchor program object
   */
  static getProgram(idl: Idl, conn: Connection, wallet: CurrentWallet) {
    if (!PgProgramInfo.pk) throw new Error("Program id not found.");

    const provider = new AnchorProvider(
      conn,
      wallet,
      AnchorProvider.defaultOptions()
    );
    return new Program(idl, PgProgramInfo.pk, provider);
  }

  /**
   * Tests the Anchor function.
   *
   * @returns the transaction signature
   */
  static async test(
    txVals: TxVals,
    idl: Idl,
    connection: Connection,
    wallet: CurrentWallet
  ) {
    // Get program
    const program = this.getProgram(idl, connection, wallet);

    // Create method
    const method = program.methods[txVals.name](...txVals.args);

    // Create instruction
    const ix = await method.accounts(txVals.accs as {}).instruction();

    // Create tx
    const tx = new Transaction();

    // Add ix to tx
    tx.add(ix);

    // Add additional signers
    let additionalSigners: Signer[] = [];
    for (const name in txVals.additionalSigners) {
      additionalSigners.push(txVals.additionalSigners[name] as Signer);
    }

    const txHash = await PgTx.send(tx, {
      connection,
      wallet,
      additionalSigners,
    });
    return txHash;
  }

  /**
   * Calculate inside and outer type of nested types
   */
  private static _getTypesFromParsedString(str: string) {
    const openIndex = str.indexOf("<");
    const closeIndex = str.lastIndexOf(">");
    const outerType = str.substring(0, openIndex);
    const innerType = str.substring(openIndex + 1, closeIndex);

    return { outerType, innerType };
  }
}
