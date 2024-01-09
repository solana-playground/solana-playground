import { utils } from "@coral-xyz/anchor";

export class PgBytes {
  /** Convert the given hex string to `Buffer`. */
  static fromHex(str: string) {
    return utils.bytes.hex.decode(str);
  }

  /** Convert the given buffer to hex string. */
  static toHex(buf: Buffer) {
    return utils.bytes.hex.encode(buf);
  }

  /** Convert the given base58 string to `Buffer`. */
  static fromBase58(str: string) {
    return utils.bytes.bs58.decode(str);
  }

  /** Convert the given buffer to base58 string. */
  static toBase58(buf: Buffer) {
    return utils.bytes.bs58.encode(buf);
  }

  /** Convert the given base64 string to `Buffer`. */
  static fromBase64(str: string) {
    return utils.bytes.base64.decode(str);
  }

  /** Convert the given buffer to base64 string. */
  static toBase64(buf: Buffer) {
    return utils.bytes.base64.encode(buf);
  }

  /** Convert the given UTF-8 string to `Buffer`. */
  static fromUtf8(str: string) {
    return Buffer.from(utils.bytes.utf8.encode(str));
  }

  /** Convert the given buffer to UTF-8 string. */
  static toUtf8(buf: Buffer) {
    return utils.bytes.utf8.decode(buf);
  }

  /** Hash the given string with SHA-256 hashing algorithm. */
  static hashSha256(str: string) {
    return utils.sha256.hash(str);
  }
}
