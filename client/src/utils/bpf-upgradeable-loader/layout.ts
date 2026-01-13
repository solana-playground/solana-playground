import * as BufferLayout from "@solana/buffer-layout";

/** Get the layout for a Rust `Vec<u8>` type. */
export const rustVecBytes = (property: string) => {
  const rvbl = BufferLayout.struct<any>(
    [
      BufferLayout.u32("length"),
      BufferLayout.u32("lengthPadding"),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), "bytes"),
    ],
    property
  );
  const _decode = rvbl.decode.bind(rvbl);
  const _encode = rvbl.encode.bind(rvbl);

  rvbl.decode = (buffer: any, offset: any) => {
    const data = _decode(buffer, offset);
    return data["bytes"];
  };

  rvbl.encode = (bytes: Buffer, buffer: any, offset: any) => {
    const data = { bytes };
    return _encode(data, buffer, offset);
  };

  (rvbl as any).alloc = (bytes: Buffer) => {
    return BufferLayout.u32().span + BufferLayout.u32().span + bytes.length;
  };

  return rvbl;
};
