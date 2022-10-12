import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { Endpoint, EXPLORER_URL, SOLSCAN_URL } from "../../constants";
import { PgConnection } from "./connection";

export class PgCommon {
  static readonly TRANSITION_SLEEP = 200;

  /**
   * @param ms amount of time to sleep in ms
   * @returns a promise that will resolve after specified ms
   */
  static async sleep(ms: number = this.TRANSITION_SLEEP) {
    return new Promise((res) => setTimeout((s) => res(s), ms));
  }

  /**
   * @returns the decoded string
   */
  static decodeArrayBuffer(arrayBuffer: ArrayBuffer, type: string = "utf-8") {
    const decoder = new TextDecoder(type);
    const decodedString = decoder.decode(arrayBuffer);

    return decodedString;
  }

  /**
   * Check whether the http response is OK.
   * If there is an error, decode the array buffer and return it.
   *
   * @returns response array buffer if the response is OK
   */
  static async checkForRespErr(resp: Response) {
    const arrayBuffer = await resp.arrayBuffer();

    if (!resp.ok) return { err: this.decodeArrayBuffer(arrayBuffer) };

    return { arrayBuffer };
  }

  /**
   * @returns first and last (default: 5) chars of a public key and '...' in between as string
   */
  static shortenPk(pk: PublicKey | string, chars: number = 5) {
    const pkStr = typeof pk === "object" ? pk.toBase58() : pk;
    return `${pkStr.slice(0, chars)}...${pkStr.slice(-chars)}`;
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

  /**
   * Convert seconds into human readable string format
   */
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

  /**
   * @returns utf-8 encoded string from the arg
   */
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
   *
   * @returns tx url of [Solana Explorer, Solscan]
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

  /**
   * Calculate basic rem operations for css
   */
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
   * @returns true if the pressed key is `Ctrl` or `Cmd`
   */
  static isKeyCtrlOrCmd(e: globalThis.KeyboardEvent) {
    return e.ctrlKey || e.metaKey;
  }

  /**
   * @returns true if the OS is Mac
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

  /**
   * @returns whether the browser is Firefox
   */
  static isFirefox() {
    return window.navigator.userAgent.includes("Firefox");
  }

  /**
   * @returns camelCase converted version of the string input
   */
  static toCamelCase(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }

  /**
   * @returns automatic airdrop amount
   */
  static getAirdropAmount(endpoint: Endpoint = PgConnection.endpoint) {
    switch (endpoint) {
      case Endpoint.LOCALHOST:
        return 100;
      case Endpoint.DEVNET:
        return 2;
      case Endpoint.TESTNET:
        return 1;
      default:
        return null;
    }
  }

  /**
   * Dispatch a custom DOM event
   *
   * @param name custom event name
   * @param detail data to send with the custom event
   */
  static createAndDispatchCustomEvent(name: string, detail?: any) {
    const customEvent = new CustomEvent(name, { detail });
    document.dispatchEvent(customEvent);
  }

  /**
   * Get send and receive event names
   *
   * @param eventName name of the custom event
   * @returns names of the send and receive
   */
  static getSendAndReceiveEventNames(eventName: string) {
    const send = eventName + "send";
    const receive = eventName + "receive";
    return { send, receive };
  }

  /**
   * Get static get and run event names
   *
   * @param eventName name of the custom event
   * @returns names of the get and run
   */
  static getStaticEventNames(eventName: string) {
    const get = eventName + "get";
    const run = eventName + "run";
    return { get, run };
  }

  /**
   * Dispatch a custom event and wait for receiver to resolve
   *
   * @param eventName name of the custom event
   * @param data data to send
   * @returns the resolved data
   */
  static async sendAndReceiveCustomEvent<A, R>(
    eventName: string,
    data?: A
  ): Promise<R> {
    const eventNames = this.getSendAndReceiveEventNames(eventName);

    // Send data
    this.createAndDispatchCustomEvent(eventNames.send, data);

    // Wait for data
    return new Promise((res, rej) => {
      const handleReceive = (
        e: UIEvent & { detail: { data: R; error?: string } }
      ) => {
        document.removeEventListener(
          eventNames.receive,
          handleReceive as EventListener
        );

        if (e.detail.error) {
          rej({ message: e.detail.error });
        } else {
          res(e.detail.data);
        }
      };

      document.addEventListener(
        eventNames.receive,
        handleReceive as EventListener
      );
    });
  }

  /**
   * Make a noun plural
   *
   * @param noun name of the noun
   * @param length item length that will decide whether to make the noun plural
   * @param plural plural version of the name for irregular suffixes
   * @returns plural version of the noun
   */
  static makePlural(noun: string, length: number, plural?: string) {
    if (length > 1) return plural ?? noun + "s";
    return noun;
  }

  /**
   * Convert objects into pretty JSON strings
   *
   * @param obj json object
   * @returns prettified string output
   */
  static prettyJSON(obj: object) {
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Adds space before the string, mainly used for terminal output
   *
   * @param str string to prepend spaces to
   * @param spaceAmount amount of space characters
   * @returns the space prepended string
   */
  static string(
    str: string,
    opts: {
      addSpace?: {
        amount: number;
        type?: "total" | "additional";
        position?: "left" | "right";
      };
      repeat?: { amount: number };
    }
  ) {
    if (opts.addSpace) {
      const space = this._repeatPattern(
        " ",
        opts.addSpace.amount -
          (opts.addSpace.type === "additional" ? 0 : str.length)
      );
      return opts.addSpace.position === "right" ? str + space : space + str;
    }
    if (opts.repeat) {
      return this._repeatPattern(str, opts.repeat.amount);
    }
  }

  private static _repeatPattern(pattern: string, amount: number) {
    return new Array(amount >= 0 ? amount : 0)
      .fill(null)
      .reduce((acc) => acc + pattern, "");
  }
}
