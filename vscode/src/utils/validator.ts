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
}
