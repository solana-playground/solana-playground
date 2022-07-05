import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { Endpoint, EXPLORER_URL, SOLSCAN_URL } from "../../constants";

export class PgCommon {
  static readonly TRANSITION_SLEEP = 200;

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
    const d = Math.floor(secs / (60 * 60 * 24)),
      h = Math.floor((secs % (60 * 60 * 24)) / (60 * 60)),
      m = Math.floor((secs % (60 * 60)) / 60),
      s = Math.floor(secs % 60);

    if (d) return `${d}d`;
    if (h) return `${h}h`;
    if (m) return `${m}m`;
    if (s) return `${s}s`;

    return "";
  }

  static getUtf8EncodedString(object: object) {
    return (
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(object))
    );
  }

  /**
   * Only used for adding cluster param to explorer url(s)
   */
  static getExplorerCluster(endpoint: string) {
    // Mainnet by default
    let cluster = "";

    if (endpoint === Endpoint.LOCALHOST) {
      cluster = "?cluster=custom&customUrl=" + Endpoint.LOCALHOST;
    } else if (
      endpoint === Endpoint.DEVNET ||
      endpoint === Endpoint.DEVNET_GENESYSGO
    )
      cluster = "?cluster=devnet";
    else if (endpoint === Endpoint.TESTNET) cluster = "?cluster=testnet";

    return cluster;
  }

  /**
   *  Used for getting transaction urls for explorers
   */
  static getExplorerTxUrls(txHash: string, endpoint: Endpoint) {
    let explorer = EXPLORER_URL + "/tx/" + txHash;
    let cluster = this.getExplorerCluster(endpoint);

    // Solscan doesn't have support for localhost
    if (endpoint === Endpoint.LOCALHOST) {
      return [explorer + cluster];
    }

    const solscan = SOLSCAN_URL + "/tx/" + txHash + cluster;
    explorer += cluster;

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

  static calculateRem(
    remOne: string,
    remTwo: string,
    operation: "add" | "substract"
  ) {
    const intOne = +remOne.split("rem")[0];
    const intTwo = +remTwo.split("rem")[0];

    let result;

    if (operation === "add") result = intOne + intTwo;
    else if (operation === "substract") result = intOne - intTwo;

    return result + "rem";
  }

  /**
   * Returns true if the pressed key is `Ctrl` or `Cmd`
   */
  static isKeyCtrlOrCmd(e: globalThis.KeyboardEvent) {
    return e.ctrlKey || e.metaKey;
  }

  /**
   * Returns true if the OS is Mac
   */
  static isMac() {
    const macPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];
    let isMac = false;
    for (const mac of macPlatforms) {
      if (window.navigator.userAgent.includes(mac)) {
        isMac = true;
        break;
      }
    }

    return isMac;
  }

  /**
   * Changes `Ctrl` to `Cmd` if the OS is Mac
   */
  static getKeybindTextOS(text: string) {
    if (this.isMac()) {
      text = text.replace("Ctrl", "Cmd");
    }
    return text;
  }

  static createAndDispatchCustomEvent(name: string, obj: object) {
    const customEvent = new CustomEvent(name, { detail: obj });

    document.dispatchEvent(customEvent);
  }
}
