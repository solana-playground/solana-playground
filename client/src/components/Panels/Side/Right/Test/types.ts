import { IdlType, IdlTypeDef } from "@project-serum/anchor/dist/cjs/idl";

const defaultTypes: IdlType[] = [
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

type StructOrEnum = {
  defined: string;
};

interface Struct {
  [key: string]: IdlType;
}

export const getFullType = (
  type: IdlType | StructOrEnum,
  idlTypes: IdlTypeDef[]
): IdlType => {
  if (defaultTypes.includes(type)) return type;

  if (typeof type === "object") {
    const customTypeName = (type as StructOrEnum).defined;
    const typeInfo = idlTypes.filter((t) => t.name === customTypeName)[0].type;

    const kind = typeInfo.kind;
    if (kind === "enum") {
      // TODO:
      // const variants = typeInfo.variants;
      // ...
    } else if (kind === "struct") {
      const fields = typeInfo.fields;
      const struct: Struct = {};

      for (const field of fields) {
        struct[field.name] = field.type;
      }

      const fullType =
        customTypeName +
        JSON.stringify(struct)
          .replace("{", " { ")
          .replace("}", " }")
          .replaceAll(":", ": ")
          .replaceAll(",", ", ")
          .replaceAll('"', "");
      return fullType as IdlType;
    }
  }

  return "string";
};
