import type { ChangeEvent } from "react";
import type { PublicKey } from "@solana/web3.js";

import {
  Endpoint,
  EventName,
  EXPLORER_URL,
  SOLSCAN_URL,
} from "../../constants";
import type {
  AllPartial,
  Fn,
  Disposable,
  Promiseable,
  SyncOrAsync,
  Arrayable,
} from "./types";

export class PgCommon {
  /**
   * @param ms amount of time to sleep in ms
   * @returns a promise that will resolve after specified ms
   */
  static async sleep(ms: number = 300) {
    return new Promise((res) => setTimeout(res, ms));
  }

  /**
   * Wait at least `ms` amount of miliseconds before resolving.
   *
   * @param promiseable either `Promise` or a function that returns a `Promise`
   * @returns the result of the promise parameter
   */
  static async transition<R>(promiseable: Promiseable<R>, ms?: number) {
    if ((promiseable as () => SyncOrAsync<R>)?.call) {
      promiseable = (promiseable as () => SyncOrAsync<R>)();
    }

    const result = (await Promise.allSettled([this.sleep(ms), promiseable]))[1];
    if (result.status === "fulfilled") {
      return result.value as Promise<Awaited<R>>;
    }

    throw new Error(result.reason?.message);
  }

  /**
   * Wait at least `ms` amount of miliseconds before timing out.
   *
   * @param promiseable either `Promise` or a function that returns a `Promise`
   * @returns the result of the promise parameter
   */
  static async timeout<R>(promiseable: Promiseable<R>, ms?: number) {
    if ((promiseable as () => SyncOrAsync<R>)?.call) {
      promiseable = (promiseable as () => SyncOrAsync<R>)();
    }

    try {
      return (await Promise.race([
        new Promise((_, rej) => this.sleep(ms).then(rej)),
        promiseable,
      ])) as Awaited<R>;
    } catch {
      console.log("Timed out");
    }
  }

  /**
   * Try the callback until the return value of the callback is a non-falsy value.
   *
   * NOTE: Only use this function if you are certain the return value of the
   * callback will eventually be a non-falsy value. It's not a good idea to use
   * this function when the return value can be a falsy value due to possible
   * infinite loop from this function.
   *
   * @param cb callback function to try
   * @param tryInterval optional try interval
   * @returns the non-nullable return value of the callback
   */
  static async tryUntilSuccess<T>(
    cb: () => Promise<NonNullable<T>>,
    tryInterval: number = 1000
  ) {
    let returnValue: T;
    while (1) {
      returnValue = await cb();
      if (returnValue) break;

      await this.sleep(tryInterval);
    }

    return returnValue!;
  }

  /**
   * Debounce the given callback.
   *
   * @param cb callback to debounce
   * @param options -
   * - delay: how long to wait before running the callback
   * - sharedTimeout: shared timeout object
   */
  static debounce(
    cb: () => void,
    options?: { delay?: number; sharedTimeout: { id?: NodeJS.Timeout } }
  ) {
    const delay = options?.delay ?? 100;
    const sharedTimeout = options?.sharedTimeout ?? {};

    return () => {
      sharedTimeout.id && clearTimeout(sharedTimeout.id);
      sharedTimeout.id = setTimeout(cb, delay);
    };
  }

  /**
   * Throttle the given callback.
   *
   * @param cb callback function to run
   * @param ms amount of delay in miliseconds
   * @returns the wrapped callback function
   */
  static throttle(cb: Fn, ms: number = 100) {
    let timeoutId: NodeJS.Timeout;
    let last = Date.now();
    let isInitial = true;

    return () => {
      const now = Date.now();
      if (isInitial) {
        cb();
        isInitial = false;
        return;
      }

      if (now < last + ms) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(cb, ms);
      } else {
        cb();
        last = now;
      }
    };
  }

  /**
   * @returns the decoded string
   */
  static decodeBytes(
    b: ArrayBuffer | Buffer | Uint8Array,
    type: string = "utf-8"
  ) {
    const decoder = new TextDecoder(type);
    const decodedString = decoder.decode(b);

    return decodedString;
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
    return lamports / PgCommon._LAMPORTS_PER_SOL;
  }

  /**
   * @returns Sol amount to equivalent lamports
   */
  static solToLamports(sol: number) {
    return sol * PgCommon._LAMPORTS_PER_SOL;
  }

  /**
   * @returns whether the given values are equal
   */
  static isEqual(value1: any, value2: any) {
    if (typeof value1 !== typeof value2) return false;

    switch (typeof value1) {
      // Default comparison
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return value1 === value2;

      // String comparison
      case "bigint":
      case "function":
      case "symbol":
        return value1.toString() === value2.toString();

      // Object keys comparison
      case "object":
        // `typeof null === "object"` -> true
        if (value1 === value2) return true;

        // Compare key lengths
        if (Object.keys(value1).length !== Object.keys(value2).length) {
          return false;
        }

        // Compare key values
        for (const key in value1) {
          if (!PgCommon.isEqual(value1[key], value2[key])) return false;
        }

        return true;
    }
  }

  /**
   * Get whether the colors are the same. Useful when comparing colors with different
   * color formats(rgb, hex...).
   *
   * @returns whether the given colors are equal
   */
  static isColorsEqual(color1: string, color2: string) {
    // Won't be reading frequently, but it gives a warning on the 2nd read.
    // Warning: Canvas2D: Multiple readback operations using getImageData are
    // faster with the willReadFrequently attribute set to true.
    const ctx = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })!;

    // Fill color1
    ctx.fillStyle = color1;
    const bg1Args: [number, number, number, number] = [0, 0, 1, 1];
    ctx.fillRect(...bg1Args);

    // Fill color2
    ctx.fillStyle = color2;
    const bg2Args: [number, number, number, number] = [1, 1, 1, 1];
    ctx.fillRect(...bg2Args);

    return PgCommon.isEqual(
      ctx.getImageData(...bg1Args).data,
      ctx.getImageData(...bg2Args).data
    );
  }

  /**
   * Set the default value for the given object.
   *
   * NOTE: This method mutates the given object in place.
   */
  static setDefault<T, D extends AllPartial<T>>(value: T, defaultValue: D) {
    for (const property in defaultValue) {
      const result = defaultValue[property] as AllPartial<T[keyof T]>;
      value[property as keyof T] ??= result as T[keyof T];

      if (typeof result === "object") {
        PgCommon.setDefault(value[property as keyof T], result);
      }
    }

    return value as T & D;
  }

  /**
   * Convert the given input to an array when the input is not an array.
   *
   * @param arrayable input to convert to array to
   * @returns the array result
   */
  static toArray<T>(arrayable: Arrayable<T>) {
    return Array.isArray(arrayable) ? arrayable : [arrayable];
  }

  /**
   * Access the property value from `.` seperated input.
   *
   * @param obj object to get property from
   * @param property `.` seperated property input
   */
  static getProperty(obj: any, property: string | string[]) {
    if (Array.isArray(property)) property = property.join(".");
    return property.split(".").reduce((acc, cur) => acc[cur], obj);
  }

  /**
   * @returns the JS number(only use it if you are certain this won't overflow)
   */
  static bigintToInt<T extends bigint | undefined>(bigint: T) {
    return (
      bigint?.toString() ? +bigint.toString() : undefined
    ) as T extends bigint ? number : undefined;
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
   * @returns the current UNIX timestamp(sec)
   */
  static getUnixTimstamp() {
    return Math.floor(Date.now() / 1000);
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
   * Get the cluster URL parameter to add to the explorer URL(s)
   *
   * @returns the cluster URL suffix
   */
  static getExplorerClusterParam(endpoint: string) {
    // Mainnet by default
    let cluster = "";

    if (endpoint === Endpoint.LOCALHOST) {
      cluster = "?cluster=custom&customUrl=" + Endpoint.LOCALHOST;
    } else if (
      endpoint === Endpoint.DEVNET ||
      endpoint === Endpoint.DEVNET_GENESYSGO
    ) {
      cluster = "?cluster=devnet";
    } else if (endpoint === Endpoint.TESTNET) {
      cluster = "?cluster=testnet";
    }

    return cluster;
  }

  /**
   * Get transaction urls for explorers
   *
   * @returns transaction url for solana explorer, solscan
   */
  static getExplorerTxUrls(txHash: string, endpoint: string) {
    let explorer = EXPLORER_URL + "/tx/" + txHash;
    const cluster = this.getExplorerClusterParam(endpoint);
    explorer += cluster;

    // Solscan doesn't have support for localhost
    if (endpoint === Endpoint.LOCALHOST) {
      return { explorer };
    }

    const solscan = SOLSCAN_URL + "/tx/" + txHash + cluster;

    return { explorer, solscan };
  }

  /**
   *  Get explorer urls for a mint
   *
   * @returns mint url for solana explorer, solscan
   */
  static getExplorerTokenUrl(mint: string, endpoint: string) {
    let explorer = EXPLORER_URL + "/address/" + mint;
    const cluster = this.getExplorerClusterParam(endpoint);
    explorer += cluster;

    // Solscan doesn't have support for localhost
    if (endpoint === Endpoint.LOCALHOST) {
      return { explorer };
    }

    const solscan = SOLSCAN_URL + "/token/" + mint + cluster;

    return { explorer, solscan };
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
    for (const mac of macPlatforms) {
      if (window.navigator.userAgent.includes(mac)) {
        return true;
      }
    }

    return false;
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
   * @returns kebab-case converted version of the Title Case string
   */
  static toKebabFromTitle(str: string) {
    return str
      .split(" ")
      .map((w) => w.toLowerCase())
      .join("-");
  }

  /**
   * @returns kebab-case converted version of the camelCase string
   */
  static toKebabFromCamel(str: string) {
    const kebab = [];

    for (const letter of str) {
      if (letter === letter.toUpperCase()) {
        kebab.push("-" + letter.toLowerCase());
      } else {
        kebab.push(letter);
      }
    }

    return kebab.reduce((acc, letter) => acc + letter);
  }

  /**
   * @returns Title Case converted version of the kebab-case string
   */
  static toTitlefromKebab(str: string) {
    return (
      str[0].toUpperCase() +
      str.slice(1).replace(/-\w/, (match) => " " + match[1].toUpperCase())
    );
  }

  /**
   * @returns the string with its first letter uppercased
   */
  static capitalize(str: string) {
    return str[0].toUpperCase() + str.slice(1);
  }

  /**
   * @returns automatic airdrop amount
   */
  static getAirdropAmount(endpoint: string) {
    switch (endpoint) {
      case Endpoint.PLAYNET:
        return 1000;
      case Endpoint.LOCALHOST:
        return 100;
      case Endpoint.TESTNET:
        return 1;
      default:
        return null;
    }
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
   * Get static get and set event names
   *
   * @param eventName name of the custom event
   * @returns names of the get and set
   */
  static getStaticStateEventNames(eventName: string) {
    const get = eventName + "get";
    const set = eventName + "set";
    return { get, set };
  }

  /**
   * Dispatch a custom DOM event
   *
   * @param name custom event name
   * @param detail data to send with the custom event
   */
  static createAndDispatchCustomEvent<T>(name: string, detail?: T) {
    const customEvent = new CustomEvent(name, { detail });
    document.dispatchEvent(customEvent);
  }

  /**
   * Dispatch a custom event and wait for receiver to resolve.
   *
   * @param eventName name of the custom event
   * @param data data to send
   * @returns the resolved data
   */
  static async sendAndReceiveCustomEvent<R, D = unknown>(
    eventName: string,
    data?: D
  ): Promise<R> {
    const eventNames = this.getSendAndReceiveEventNames(eventName);

    // Send data
    this.createAndDispatchCustomEvent(eventNames.send, data);

    // Wait for data
    return new Promise((res, rej) => {
      const handleReceive = (
        ev: UIEvent & { detail: { data: R; error?: string } }
      ) => {
        document.removeEventListener(
          eventNames.receive,
          handleReceive as EventListener
        );

        if (ev.detail.error) {
          rej({ message: ev.detail.error });
        } else {
          res(ev.detail.data);
        }
      };

      document.addEventListener(
        eventNames.receive,
        handleReceive as EventListener
      );
    });
  }

  /**
   * Handle change event.
   *
   * If `params.initialRun` is specified, the callback will run immediately with
   * the given `params.initialRun.value`. Any subsequent runs are only possible
   * through the custom event listener.
   *
   * @returns a dispose function to clear the event
   */
  static onDidChange<T>(params: {
    cb: (value: T) => any;
    eventName: EventName | (string & {});
    // TODO: make it run by default
    initialRun?: { value: T };
  }): Disposable {
    type Event = UIEvent & { detail: T };

    const handle = (ev: Event) => {
      params.cb(ev.detail);
    };

    if (params.initialRun) handle({ detail: params.initialRun.value } as Event);

    document.addEventListener(params.eventName, handle as EventListener);
    return {
      dispose: () => {
        document.removeEventListener(params.eventName, handle as EventListener);
      },
    };
  }

  /**
   * Batch changes together.
   *
   * @param cb callback to run
   * @param onChanges onChange methods
   * @returns a dispose function to clear all events
   */
  static batchChanges(
    cb: (value?: unknown) => void,
    onChanges: Array<(value: any) => Disposable>
  ): Disposable {
    // Intentionally initializing outside of the closure to share `sharedTimeout`
    const debounceOptions = { delay: 0, sharedTimeout: {} };

    const disposables = onChanges.map((onChange) => {
      return onChange(PgCommon.debounce(cb, debounceOptions));
    });

    return {
      dispose: () => disposables.forEach((disposable) => disposable.dispose()),
    };
  }

  /**
   * Runs `setInterval` callback function only when the document has focus
   *
   * @param cb callback to run on interval
   * @param ms interval time amount in miliseconds
   * @returns a cleanup timer that should be called with `clearInterval`
   */
  static setIntervalOnFocus(cb: () => void, ms?: number) {
    return setInterval(() => {
      if (document.hasFocus()) cb();
    }, ms);
  }

  /**
   * Import file(s) from the user's file system
   *
   * @param onChange callback function to run when file input has changed
   * @param opts optional options
   */
  static import(
    onChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>,
    opts?: { accept?: string; dir?: boolean }
  ) {
    const el = document.createElement("input");
    el.type = "file";
    if (opts?.accept) el.accept = opts.accept;

    const dirProps = opts?.dir
      ? {
          webkitdirectory: "",
          mozdirectory: "",
          directory: "",
          multiple: true,
        }
      : {};
    for (const key in dirProps) {
      // @ts-ignore
      el[key] = dirProps[key as keyof typeof dirProps];
    }

    // @ts-ignore
    el.onchange = onChange;

    el.click();
  }

  /**
   * Export the content as a file
   *
   * @param name name of the exported file
   * @param content content of the exported file
   */
  static export(name: string, content: string) {
    const el = document.createElement("a");
    el.download = name;
    el.href = content;
    el.click();
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
   * Get human readable date time from unix timestamp
   *
   * @param unixTs unix timestamp in seconds
   * @param opts date format options
   * @returns formatted date string
   */
  static getFormattedDateFromUnixTimestamp(
    unixTs: number,
    opts?: {
      locale: string;
    } & Pick<Intl.DateTimeFormatOptions, "dateStyle" | "timeStyle" | "timeZone">
  ) {
    return new Intl.DateTimeFormat(opts?.locale ?? "en-US", {
      dateStyle: opts?.dateStyle ?? "full",
      timeStyle: opts?.timeStyle ?? "long",
      timeZone: opts?.timeZone ?? "UTC",
    }).format(unixTs * 1e3);
  }

  /**
   * Append '/' to the end of the string
   *
   * @param str string to append slash to
   * @returns the slash appended string
   */
  static appendSlash(str: string) {
    if (!str) return "";
    return str + (str.endsWith("/") ? "" : "/");
  }

  /**
   * Get the string without '/' prefix
   *
   * @param str string input
   * @returns the string without slash prefix
   */
  static withoutPreSlash(str: string) {
    return str[0] === "/" ? str.substring(1) : str;
  }

  /**
   * Join the paths without caring about incorrect '/' inside paths
   *
   * @param paths paths to join
   * @returns the joined path
   */
  static joinPaths(paths: string[]) {
    return paths.reduce(
      (acc, cur) => this.appendSlash(acc) + this.withoutPreSlash(cur)
    );
  }

  /**
   * Adds space before the string, mainly used for terminal output
   *
   * @param str string to prepend spaces to
   * @param opts -
   * - addSpace: add space before or after the string
   * - repeat: repeat the string `repeat.amount` times
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

  /**
   * Intentionally not using web3.js.LAMPORTS_PER_SOL to not increase main
   * bundle size since `PgCommon` is getting loaded at the start of the app.
   */
  private static _LAMPORTS_PER_SOL = 1000000000;

  /**
   * Repeat a `pattern` `amount` times
   *
   * @param pattern pattern to repeat
   * @param amount amount of times to repeat
   * @returns the output
   */
  private static _repeatPattern(pattern: string, amount: number) {
    return new Array(amount >= 0 ? amount : 0)
      .fill(null)
      .reduce((acc) => acc + pattern, "");
  }
}
