import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Response } from "node-fetch";
import { TextDecoder } from "util";

/** Package managers */
export enum PackageMananger {
  NPM = 0,
  YARN = 1,
}

export class PgCommon {
  /**
   * @param ms amount of time to sleep in ms
   * @returns a promise that will resolve after specified ms
   */
  static async sleep(ms: number = 300) {
    return new Promise((res) => setTimeout((s) => res(s), ms));
  }

  /**
   * @returns the decoded string
   */
  static decodeBytes(
    bytes: Uint8Array | ArrayBuffer | Buffer,
    encoding: string = "utf-8"
  ) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(bytes);
  }

  /**
   * Check whether the http response is OK.
   * If there is an error, decode the array buffer and return it.
   *
   * @returns response array buffer if the response is OK
   */
  static async checkForRespErr(resp: Response) {
    const arrayBuffer = await resp.arrayBuffer();

    if (!resp.ok) throw new Error(this.decodeBytes(arrayBuffer));

    return arrayBuffer;
  }

  /**
   * @returns lamports amount to equivalent Sol
   */
  static lamportsToSol(lamports: number) {
    return lamports / LAMPORTS_PER_SOL;
  }

  /**
   * @returns Sol amount to equivalent lamports
   */
  static solToLamports(sol: number) {
    return sol * LAMPORTS_PER_SOL;
  }
}
