import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Endpoint, EXPLORER_URL, SOLSCAN_URL } from "../../constants";

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

  static shortenPk(pk: PublicKey | string, chars: number = 5) {
    const pkStr = typeof pk === "object" ? pk.toBase58() : pk;
    return `${pkStr.slice(0, chars)}...${pkStr.slice(-chars)}`;
  }

  static lamportsToSol(lamports: number) {
    return lamports / LAMPORTS_PER_SOL;
  }

  static solToLamports(sol: number) {
    return sol * LAMPORTS_PER_SOL;
  }

  static secondsToTime(secs: number) {
    const h = Math.floor(secs / 3600),
      m = Math.floor((secs % 3600) / 60),
      s = Math.floor(secs % 60);

    if (!(h + m)) return `${s}s`;
    else if (!h) return `${m}m`;
    else if (!m) return `${h}h`;

    return "";
  }

  static getUtf8EncodedString(object: object) {
    return (
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(object))
    );
  }

  static getExplorerUrls(txHash: string, endpoint: Endpoint) {
    const explorer =
      EXPLORER_URL + "/tx/" + txHash + "?cluster=custom&customUrl=" + endpoint;

    let cluster = "";
    if (endpoint === Endpoint.LOCALHOST) return [explorer];
    else if (
      endpoint === Endpoint.DEVNET ||
      endpoint === Endpoint.DEVNET_GENESYSGO
    )
      cluster = "?cluster=devnet";
    else if (endpoint === Endpoint.TESTNET) cluster = "?cluster=testnet";

    const solscan = SOLSCAN_URL + "/tx/" + txHash + cluster;

    return [explorer, solscan];
  }

  static isInt(str: string) {
    const intRegex = /^-?\d+$/;
    if (!intRegex.test(str)) return false;

    const int = parseInt(str, 10);
    return parseFloat(str) === int && !isNaN(int);
  }

  static isFloat(str: string) {
    const floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(str)) return false;

    const float = parseFloat(str);
    if (isNaN(float)) return false;
    return true;
  }
}
