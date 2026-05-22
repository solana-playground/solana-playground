import { utils } from "@coral-xyz/anchor";

export class PgBytes {
  /** Convert the given buffer to a UTF-8 string. */
  static decodeUtf8(buf: Buffer) {
    return utils.bytes.utf8.decode(buf);
  }

  /** Convert the given UTF-8 string to a `Buffer`. */
  static encodeUtf8(str: string) {
    return Buffer.from(utils.bytes.utf8.encode(str));
  }

  /** Convert the given hex string to a `Buffer`. */
  static decodeHex(str: string) {
    return utils.bytes.hex.decode(str);
  }

  /** Convert the given buffer to a hex string. */
  static encodeHex(buf: Buffer) {
    return utils.bytes.hex.encode(buf);
  }

  /** Convert the given base58 string to a `Buffer`. */
  static decodeBase58(str: string) {
    return utils.bytes.bs58.decode(str);
  }

  /** Convert the given buffer to a base58 string. */
  static encodeBase58(buf: Buffer) {
    return utils.bytes.bs58.encode(buf);
  }

  /** Convert the given base64 string to a `Buffer`. */
  static decodeBase64(str: string) {
    return utils.bytes.base64.decode(str);
  }

  /** Convert the given buffer to a base64 string. */
  static encodeBase64(buf: Buffer) {
    return utils.bytes.base64.encode(buf);
  }

  /** Hash the given string with SHA-256 hashing algorithm. */
  static hashSha256(str: string) {
    return utils.sha256.hash(str);
  }
}
