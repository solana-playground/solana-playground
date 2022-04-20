import { PublicKey } from "@solana/web3.js";

export class PgCommon {
  static async sleep(ms: number) {
    return new Promise((res) => setTimeout((s) => res(s), ms));
  }

  static async checkForRespErr(resp: Response) {
    const arrayBuffer = await resp.arrayBuffer();

    if (!resp.ok) {
      const decoder = new TextDecoder("utf-8");
      const decodedString = decoder.decode(arrayBuffer);
      return { err: decodedString };
    }

    return { arrayBuffer };
  }

  static shortenPk(pk: PublicKey, chars: number = 5) {
    const pkStr = pk.toBase58();
    return `${pkStr.slice(0, chars)}...${pkStr.slice(-chars)}`;
  }
}
