import { PublicKey } from "@solana/web3.js";

export class PgValidator {
  /**
   * @returns whether a given string is parseable to an int
   */
  static isInt(str: string) {
    const intRegex = /^-?\d+$/;
    if (!intRegex.test(str)) return false;

    const int = parseInt(str, 10);
    return parseFloat(str) === int && !isNaN(int);
  }

  /**
   * @returns whether a given string is parseable to a float
   */
  static isFloat(str: string) {
    const floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(str)) return false;

    const float = parseFloat(str);
    if (isNaN(float)) return false;
    return true;
  }

  /**
   * @returns whether a given string is parseable to a hexadecimal
   */
  static isHex(str: string) {
    const hexRegex = /(0x)?[\da-f]+/i;
    const result = hexRegex.exec(str);
    if (!result) return false;

    return result[0] === str;
  }

  /**
   * @returns whether a given string is parseable to a pubkey
   */
  static isPubkey(str: string) {
    try {
      new PublicKey(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @returns whether a given string is a URL
   */
  static isUrl(str: string) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
}
