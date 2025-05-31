import { BN, DecodeType } from "@coral-xyz/anchor";
import type {
  Idl,
  IdlEnumFieldsNamed,
  IdlEnumFieldsTuple,
  IdlEnumVariant,
  IdlType,
} from "@coral-xyz/anchor/dist/cjs/idl";

import { PgCommon } from "../common";
import { PgWeb3 } from "../web3";
import type { MergeUnion, OrString } from "../types";

export type {
  Idl,
  IdlAccount,
  IdlInstruction,
  IdlType,
} from "@coral-xyz/anchor/dist/cjs/idl";

interface PgIdlType<
  T extends IdlType,
  V extends DecodeType<T, never> = DecodeType<T, never>
> {
  /** Display type to show in UI */
  displayType: OrString<Exclude<T, object>>;
  /**
   * Parse from string to the IDL type's JS equivalent.
   *
   * @param value string value
   * @returns the parsed value
   */
  parse: (value: string) => V;
  /**
   * Serialize the type.
   *
   * **NOTE:** This is default serialization and is **not** related to `borsh`.
   *
   * @param value parsed value
   * @returns the serialized bytes
   */
  toBuffer: (value: V) => Buffer;
  /**
   * Generate a stringified random value.
   *
   * @returns the generated value
   */
  generateRandom: () => string;
}

/**
 * Get IDL type, i.e. an object that has all the necessary data to handle
 * operations of the given IDL type.
 *
 * @param idlType Anchor IDL type
 * @param idl Anchor IDL(only required for defined types)
 * @returns the IDL type
 */
// @ts-ignore
export const getIdlType: <T extends IdlType>(
  idlType: T,
  idl?: Idl
) => PgIdlType<T> = (idlType, idl) => {
  switch (idlType) {
    case "publicKey":
      return publicKey;
    case "string":
      return string;
    case "bool":
      return bool;
    case "u8":
      return u8;
    case "u16":
      return u16;
    case "u32":
      return u32;
    case "u64":
      return u64;
    case "u128":
      return u128;
    case "i8":
      return i8;
    case "i16":
      return i16;
    case "i32":
      return i32;
    case "i64":
      return i64;
    case "i128":
      return i128;
    case "f32":
      return f32;
    case "f64":
      return f64;
    case "bytes":
      return bytes;
  }

  const { defined, option, coption, array, vec } = idlType as Partial<
    MergeUnion<Exclude<IdlType, string>>
  >;

  if (defined) {
    if (!idl?.types) {
      throw new Error(`Defined type \`${defined}\` requires idl.types`);
    }

    const definedType = idl.types.find((type) => type.name === defined);
    if (!definedType) throw new Error(`Type \`${defined}\` not found`);

    switch (definedType.type.kind) {
      case "struct": {
        const fields = definedType.type.fields;
        return createIdlType({
          displayType: definedType.name,
          parse: (value) => {
            if (!value.startsWith("{") || !value.endsWith("}")) {
              throw new Error("Not an object");
            }

            // The implementation assumes the struct only has basic properties
            // e.g. `String` and not a nested struct property. The initial
            // implementation of the test UI had support for complex structs
            // from JSON inputs but that wasn't intuitive and it also didn't
            // work for some types like `u64`. The current implementation
            // supports inputs similar to JS argument inputs. Adding support
            // for complex structs would make the implementation a lot harder
            // as it would require some sort of a JS parser to correctly parse
            // the input and given how rarely they are being used, it's better
            // to avoid implementing complex struct support.
            const inputFields = value.slice(1, -1).split(",");
            if (inputFields.length !== fields.length) {
              throw new Error("Struct fields do not match");
            }

            return inputFields.reduce((acc, cur) => {
              const [key, value] = cur.split(":").map((part) => part.trim());
              const field = fields.find((f) => f.name === key);
              if (!field) throw new Error(`Field \`${key}\` not found`);

              acc[key] = getIdlType(field.type, idl).parse(value);
              return acc;
            }, {} as Record<string, unknown>);
          },
          toBuffer: (value) => {
            const buffers = Object.entries(value as object).map(
              ([key, value]) => {
                const field = fields.find((field) => field.name === key);
                if (!field) throw new Error(`Field \`${key}\` not found`);
                return getIdlType(field.type, idl).toBuffer(value);
              }
            );
            return Buffer.concat(buffers);
          },
          generateRandom: () => {
            return (
              fields.reduce((acc, field, i) => {
                const value = getIdlType(field.type, idl).generateRandom();
                return `${acc}${i ? "," : ""} ${field.name}: ${value}`;
              }, "{") + " }"
            );
          },
        });
      }

      case "enum": {
        const variants = definedType.type.variants;

        const getVariant = (variantName: string) => {
          // Object keys are converted to camelCase because Anchor generated
          // enum names as PascalCase prior to 0.29.0 and the user can import
          // a custom IDL.
          const camelCaseVariantName = PgCommon.toCamelCase(variantName);
          const variant = variants.find(
            (v) => PgCommon.toCamelCase(v.name) === camelCaseVariantName
          );
          if (!variant) {
            throw new Error(`Variant \`${variantName}\` not found`);
          }

          return variant;
        };

        const handleVariant = <U, N, T>(
          variant: IdlEnumVariant,
          unitCb: () => U,
          namedCb: (fields: IdlEnumFieldsNamed) => N,
          tupleCb: (fields: IdlEnumFieldsTuple) => T
        ) => {
          // Unit
          if (!variant.fields?.length) return unitCb();

          // Named
          if ((variant.fields as IdlEnumFieldsNamed)[0].name) {
            return namedCb(variant.fields as IdlEnumFieldsNamed);
          }

          // Tuple
          return tupleCb(variant.fields as IdlEnumFieldsTuple);
        };

        const getStructFromNamedEnum = (fields: IdlEnumFieldsNamed) => {
          return getIdlType(
            { defined: "__" },
            {
              ...idl,
              types: [
                ...idl.types!,
                {
                  name: "__",
                  type: { kind: "struct", fields },
                },
              ],
            }
          );
        };

        return createIdlType({
          displayType: definedType.name,
          parse: (value) => {
            // Allow unit enums to be passed by name
            try {
              const unitVariant = getVariant(value);
              if (unitVariant) return { [PgCommon.toCamelCase(value)]: {} };
            } catch {}

            // Named
            if (!value.startsWith("{") || !value.endsWith("}")) {
              throw new Error("Not an object");
            }

            const parsedKeyValue = value
              .slice(1, -1)
              .match(/(\S+)(\s*)?:\s+(.+[\]|}])/);
            if (!parsedKeyValue) throw new Error("Unable to parse input");

            const variantKey = PgCommon.toCamelCase(parsedKeyValue[1]);
            const variantValue = parsedKeyValue[3];

            const openingChar = variantValue[0];
            const isNamed = openingChar === "{"; // { named: { a: 1, b: true } }
            const isUnnamed = openingChar === "["; // { unnamed: [1, true] }
            if (!isNamed && !isUnnamed) throw new Error("Unable to parse");

            const parsedValue = handleVariant(
              getVariant(variantKey),
              () => ({}),
              (fields) => getStructFromNamedEnum(fields).parse(variantValue),
              (fields) => {
                const inputElements = variantValue.slice(1, -1).split(",");
                if (inputElements.length !== fields.length) {
                  throw new Error("Tuple length doesn't match");
                }
                return inputElements.map((value, i) => {
                  return getIdlType(fields[i], idl).parse(value.trim());
                });
              }
            );

            return { [variantKey]: parsedValue };
          },
          toBuffer: (value: any) => {
            const variantName = Object.keys(value)[0];
            const variantValue = value[variantName];
            const disc = variants.findIndex(
              (v) => PgCommon.toCamelCase(v.name) === variantName
            );
            const data = handleVariant(
              getVariant(variantName),
              () => Buffer.alloc(0),
              (fields) => {
                const buffers = fields.map((f) => {
                  return getIdlType(f.type, idl).toBuffer(variantValue[f.name]);
                });
                return Buffer.concat(buffers);
              },
              (fields) => {
                const buffers = fields.map((f, i) => {
                  return getIdlType(f, idl).toBuffer(variantValue[i]);
                });
                return Buffer.concat(buffers);
              }
            );

            return Buffer.concat([Buffer.from([disc]), data]);
          },
          generateRandom: () => {
            const index = PgCommon.generateRandomInt(0, variants.length - 1);
            const variant = variants[index];
            const camelCaseName = PgCommon.toCamelCase(variant.name);

            return handleVariant(
              variant,
              () => camelCaseName,
              (fields) => {
                return (
                  `{ ${camelCaseName}: ` +
                  getStructFromNamedEnum(fields).generateRandom() +
                  " }"
                );
              },
              (fields) => {
                return (
                  `{ ${camelCaseName}: [` +
                  fields.reduce((acc, field, i) => {
                    return (
                      acc +
                      (i ? ", " : "") +
                      getIdlType(field, idl).generateRandom()
                    );
                  }, "") +
                  "] }"
                );
              }
            );
          },
        });
      }

      case "alias": {
        return {
          ...getIdlType(definedType.type.value, idl),
          displayType: definedType.name,
        };
      }
    }
  }

  const optionLike = option ?? coption;
  if (optionLike) {
    const none = option ? [0] : [0, 0, 0, 0];
    const some = option ? [1] : [1, 0, 0, 0];
    const inner = getIdlType(optionLike, idl);
    return createIdlType({
      ...inner,
      displayType: `${option ? "" : "C"}Option<${inner.displayType}>`,
      parse: (value) => {
        if (["", "null", "none"].includes(value)) return null;
        return inner.parse(value);
      },
      toBuffer: (value) => {
        if (value === null) return Buffer.from(none);
        return Buffer.concat([Buffer.from(some), inner.toBuffer(value)]);
      },
      generateRandom: () => {
        if (!PgCommon.generateRandomInt(0, 1)) return "null";
        return inner.generateRandom();
      },
    });
  }

  if (array || vec) {
    const [elementType, len] = array ?? [vec];
    const inner = getIdlType(elementType!, idl);
    return createIdlType({
      displayType: array
        ? `[${inner.displayType}; ${len}]`
        : `Vec<${inner.displayType}>`,
      parse: (value) => {
        if (!value.startsWith("[") || !value.endsWith("]")) {
          throw new Error("Not an array");
        }

        const parsedArray = value
          .slice(1, -1)
          .split(",")
          .map((el) => el.trim())
          .filter(Boolean)
          .map(inner.parse);
        if (array && parsedArray.length !== len) {
          throw new Error("Invalid length");
        }
        return parsedArray;
      },
      toBuffer: (value) => {
        if (!Array.isArray(value)) throw new Error("Not an array");
        return Buffer.concat(value.map(inner.toBuffer));
      },
      generateRandom: () => {
        const stringifiedArray = JSON.stringify(
          new Array(array ? len : 4).fill(null).map(inner.generateRandom)
        );
        if (inner.displayType === "string") return stringifiedArray;
        return stringifiedArray.replaceAll('"', "");
      },
    });
  }

  throw new Error(`Unknown IDL type: ${idlType}`);
};

/**
 * Create an IDL type.
 *
 * @param idlType type-inferred IDL type
 * @returns the created IDL type
 */
const createIdlType = <T extends IdlType>(idlType: PgIdlType<T>) => {
  return idlType;
};

const publicKey = createIdlType({
  displayType: "publicKey",
  parse: (value) => new PgWeb3.PublicKey(string.parse(value)),
  toBuffer: (value) => value.toBuffer(),
  generateRandom: () => PgWeb3.Keypair.generate().publicKey.toBase58(),
});

const string = createIdlType({
  displayType: "string",
  // Remove the quotes from string in order to make struct inputs intuitive
  // e.g. `{ name: "Abc" }` should be parsed as "Abc" instead of "\"Abc\"".
  // Maybe replace only the first and the last quotes?
  parse: (value) => value.replaceAll('"', "").replaceAll("'", ""),
  toBuffer: (value) => Buffer.from(value),
  generateRandom: () => {
    return Buffer.from(
      new Array(4).fill(0).map(() => PgCommon.generateRandomInt(65, 122))
    ).toString();
  },
});

const bool = createIdlType({
  displayType: "bool",
  parse: (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error("Invalid bool");
  },
  toBuffer: (value) => Buffer.from([value ? 1 : 0]),
  generateRandom: () => (PgCommon.generateRandomInt(0, 1) ? "true" : "false"),
});

const u8 = createIdlType({
  displayType: "u8",
  parse: (value) => {
    assertUint(value, 1);
    return parseInt(value);
  },
  toBuffer: (value) => Buffer.from([value]),
  generateRandom: () => generateRandomUint(1),
});

const u16 = createIdlType({
  displayType: "u16",
  parse: (value) => {
    assertUint(value, 2);
    return parseInt(value);
  },
  toBuffer: (value) => new BN(value).toArrayLike(Buffer, "le", 2),
  generateRandom: () => generateRandomUint(2),
});

const u32 = createIdlType({
  displayType: "u32",
  parse: (value) => {
    assertUint(value, 4);
    return parseInt(value);
  },
  toBuffer: (value) => new BN(value).toArrayLike(Buffer, "le", 4),
  generateRandom: () => generateRandomUint(4),
});

const u64 = createIdlType({
  displayType: "u64",
  parse: (value) => {
    assertUint(value, 8);
    return new BN(value);
  },
  toBuffer: (value) => value.toArrayLike(Buffer, "le", 8),
  generateRandom: () => generateRandomUint(8),
});

const u128 = createIdlType({
  displayType: "u128",
  parse: (value) => {
    assertUint(value, 16);
    return new BN(value);
  },
  toBuffer: (value) => value.toArrayLike(Buffer, "le", 16),
  generateRandom: () => generateRandomUint(16),
});

const i8 = createIdlType({
  displayType: "i8",
  parse: (value) => {
    assertInt(value, 1);
    return parseInt(value);
  },
  toBuffer: (value) => Buffer.from([value]),
  generateRandom: () => generateRandomInt(1),
});

const i16 = createIdlType({
  displayType: "i16",
  parse: (value) => {
    assertInt(value, 2);
    return parseInt(value);
  },
  toBuffer: (value) => new BN(value).toArrayLike(Buffer, "le", 2),
  generateRandom: () => generateRandomInt(2),
});

const i32 = createIdlType({
  displayType: "i32",
  parse: (value) => {
    assertInt(value, 4);
    return parseInt(value);
  },
  toBuffer: (value) => new BN(value).toArrayLike(Buffer, "le", 4),
  generateRandom: () => generateRandomInt(4),
});

const i64 = createIdlType({
  displayType: "i64",
  parse: (value) => {
    assertInt(value, 8);
    return new BN(value);
  },
  toBuffer: (value) => value.toArrayLike(Buffer, "le", 8),
  generateRandom: () => generateRandomInt(8),
});

const i128 = createIdlType({
  displayType: "i128",
  parse: (value) => {
    assertInt(value, 16);
    return new BN(value);
  },
  toBuffer: (value) => value.toArrayLike(Buffer, "le", 16),
  generateRandom: () => generateRandomInt(16),
});

const f32 = createIdlType({
  displayType: "f32",
  parse: (value) => {
    if (!PgCommon.isFloat(value)) throw new Error("Invalid float");
    return parseFloat(value);
  },
  toBuffer: (value) => {
    const buf = Buffer.alloc(4);
    buf.writeFloatLE(value);
    return buf;
  },
  generateRandom: () => Math.random().toString(),
});

const f64 = createIdlType({
  displayType: "f64",
  parse: (value) => {
    if (!PgCommon.isFloat(value)) throw new Error("Invalid float");
    return parseFloat(value);
  },
  toBuffer: (value) => {
    const buf = Buffer.alloc(8);
    buf.writeFloatLE(value);
    return buf;
  },
  generateRandom: () => Math.random().toString(),
});

const bytes = createIdlType({
  displayType: "bytes",
  parse: (value) => {
    const array: number[] = JSON.parse(value);
    const isValid = array.every((el) => el === 0 || u8.parse(el.toString()));
    if (!isValid) throw new Error("Invalid bytes");
    return Buffer.from(array);
  },
  toBuffer: (value) => value,
  generateRandom: () => {
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    return JSON.stringify(Array.from(randomBytes));
  },
});

/**
 * Assert whether the given value is parsable to an unsigned integer and is
 * within the allowed range.
 *
 * @param value input
 * @param len byte length for the unsigned integer
 */
function assertUint(value: string, len: number) {
  if (value === "") throw new Error("Cannot be empty");

  const bn = new BN(value);
  if (bn.isNeg()) {
    throw new Error(`uint cannot be negative: ${value}`);
  }
  if (bn.gt(new BN(new Array(len).fill(0xff)))) {
    throw new Error(`${value} is not within range`);
  }
}

/**
 * Assert whether the given value is parsable to an signed integer and is
 * within the allowed range.
 *
 * @param value input
 * @param len byte length for the signed integer
 */
function assertInt(value: string, len: number) {
  if (value === "") throw new Error("Cannot be empty");

  const bn = new BN(value);
  const intMax = new BN(new Array(len).fill(0xff)).divn(2);
  if (bn.gt(intMax) || bn.lt(intMax.addn(1).neg())) {
    throw new Error(`${value} is not within range`);
  }
}

/**
 * Generate a random unsigned integer for the given byte length.
 *
 * @param len byte length
 * @returns the randomly generated unsigned integer
 */
function generateRandomUint(len: number) {
  return PgCommon.generateRandomBigInt(
    0n,
    BigInt(new BN(new Array(len).fill(0xff)).toString())
  ).toString();
}

/**
 * Generate a random signed integer for the given byte length.
 *
 * @param len byte length
 * @returns the randomly generated signed integer
 */
function generateRandomInt(len: number) {
  const max = BigInt(new BN(new Array(len).fill(0xff)).toString()) / 2n;
  return PgCommon.generateRandomBigInt(-(max + 1n), max).toString();
}
