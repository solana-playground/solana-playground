import { utils } from "@coral-xyz/anchor";

import type { OrString } from "./types";

type BinaryEncoding = "hex" | "base58" | "base64";
type TextEncoding = OrString<"utf-8">;
type Bytes = BufferSource | number[];

export class PgCodec {
  /**
   * Decode the given string to bytes using the given binary encoding.
   *
   * @param str string to decode
   * @param encoding binary encoding
   * @returns the decoded bytes
   */
  static decodeBinary(str: string, encoding: BinaryEncoding) {
    switch (encoding) {
      case "hex":
        return utils.bytes.hex.decode(str);
      case "base58":
        return utils.bytes.bs58.decode(str);
      case "base64":
        return utils.bytes.base64.decode(str);
    }
  }

  /**
   * Encode the given bytes to a string using the given binary encoding.
   *
   * @param bytes bytes to encode
   * @param encoding binary encoding
   * @returns the encoded string
   */
  static encodeBinary(bytes: Bytes, encoding: BinaryEncoding) {
    const buf = this._normalizeBytes(bytes);
    switch (encoding) {
      case "hex":
        return utils.bytes.hex.encode(buf);
      case "base58":
        return utils.bytes.bs58.encode(buf);
      case "base64":
        return utils.bytes.base64.encode(buf);
    }
  }

  /**
   * Decode the given bytes to a string using the given text encoding.
   *
   * @param bytes bytes to decode
   * @param encoding text encoding
   * @returns the decoded text
   */
  static decodeText(bytes: Bytes, encoding: TextEncoding = "utf-8") {
    const buf = this._normalizeBytes(bytes);
    return new TextDecoder(encoding).decode(buf);
  }

  /**
   * Encode text (UTF-8 only).
   *
   * @param str string to encode
   * @returns the encoded bytes
   */
  static encodeText(str: string) {
    return Buffer.from(new TextEncoder().encode(str));
  }

  // TODO: Find a more fitting place for this
  /** Hash the given string with SHA-256 hashing algorithm. */
  static hashSha256(str: string) {
    return utils.sha256.hash(str);
  }

  /**
   * Normalize bytes by converting them to a `Buffer`.
   *
   * @param b bytes
   * @returns the normalized buffer
   */
  private static _normalizeBytes(b: Bytes) {
    if (ArrayBuffer.isView(b)) {
      return Buffer.from(new Uint8Array(b.buffer, b.byteOffset, b.byteLength));
    }

    // Why can't we just `return Buffer.from(b)`?
    return Array.isArray(b) ? Buffer.from(b) : Buffer.from(b);
  }
}
