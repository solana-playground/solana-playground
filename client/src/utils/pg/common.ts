import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export class PgCommon {
  static async sleep(ms: number) {
    return new Promise((res) => setTimeout((s) => res(s), ms));
  }

  static decodeArrayBuffer(arrayBuffer: ArrayBuffer) {
    const decoder = new TextDecoder("utf-8");
    const decodedString = decoder.decode(arrayBuffer);

    return decodedString;
  }

  static async checkForRespErr(resp: Response) {
    const arrayBuffer = await resp.arrayBuffer();

    if (!resp.ok) return { err: this.decodeArrayBuffer(arrayBuffer) };

    return { arrayBuffer };
  }

  static shortenPk(pk: PublicKey, chars: number = 5) {
    const pkStr = pk.toBase58();
    return `${pkStr.slice(0, chars)}...${pkStr.slice(-chars)}`;
  }

  static lamportsToSol(lamports: number) {
    return lamports / LAMPORTS_PER_SOL;
  }

  static SolToLamports(sol: number) {
    return sol * LAMPORTS_PER_SOL;
  }
}
