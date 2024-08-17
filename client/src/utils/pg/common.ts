import type { ChangeEvent } from "react";

import { Endpoint, EventName } from "../../constants";
import type {
  AllPartial,
  Disposable,
  Promisable,
  SyncOrAsync,
  Arrayable,
  OrString,
  ValueOf,
} from "./types";

export class PgCommon {
  /**
   * @param ms amount of time to sleep in ms
   * @returns a promise that will resolve after specified ms
   */
  static async sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  /**
   * Wait at least `ms` amount of miliseconds before resolving.
   *
   * @param promisable either `Promise` or a function that returns a `Promise`
   * @returns the result of the promise parameter
   */
  static async transition<R>(promisable: Promisable<R>, ms: number = 300) {
    if ((promisable as () => SyncOrAsync<R>)?.call) {
      promisable = (promisable as () => SyncOrAsync<R>)();
    }

    const result = (await Promise.allSettled([this.sleep(ms), promisable]))[1];
    if (result.status === "fulfilled") {
      return result.value as Promise<Awaited<R>>;
    }

    throw new Error(result.reason?.message);
  }

  /**
   * Wait at least `ms` amount of miliseconds before timing out.
   *
   * @param promisable either `Promise` or a function that returns a `Promise`
   * @throws on timeout
   * @returns the result of the promise parameter
   */
  static async timeout<R>(promisable: Promisable<R>, ms: number) {
    if ((promisable as () => SyncOrAsync<R>)?.call) {
      promisable = (promisable as () => SyncOrAsync<R>)();
    }

    return (await Promise.race([
      new Promise((_, rej) => this.sleep(ms).then(() => rej("Timed out"))),
      promisable,
    ])) as Awaited<R>;
  }

  /**
   * Try the given callback until success.
   *
   * @param cb callback function to try
   * @param tryInterval try interval in miliseconds
   * @returns the return value of the callback
   */
  static async tryUntilSuccess<T>(
    cb: () => SyncOrAsync<T>,
    tryInterval: number
  ): Promise<T> {
    let returnValue: T;
    while (1) {
      const start = performance.now();
      try {
        returnValue = await this.timeout(cb, tryInterval);
        break;
      } catch {
        const remaining = tryInterval - (performance.now() - start);
        if (remaining > 0) await this.sleep(remaining);
      }
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
    options?: { delay?: number; sharedTimeout?: { id?: NodeJS.Timeout } }
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
  static throttle<T extends unknown[]>(
    cb: (...args: T) => void,
    ms: number = 100
  ) {
    let timeoutId: NodeJS.Timeout;
    let last = Date.now();
    let isInitial = true;

    return (...args: T) => {
      const now = Date.now();
      if (isInitial) {
        cb(...args);
        isInitial = false;
        return;
      }

      if (now < last + ms) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => cb(...args), ms);
      } else {
        cb(...args);
        last = now;
      }
    };
  }

  /**
   * Execute the given callback in order.
   *
   * This is particularly useful when the desired behavior of an `onChange`
   * event is to execute its callback in order.
   *
   * @param cb callback to run
   * @returns the wrapped callback function
   */
  static executeInOrder<T>(cb: (...args: [T]) => SyncOrAsync) {
    type Callback = typeof cb;
    type CallbackWithArgs = [Callback, Parameters<Callback>];

    const queue: CallbackWithArgs[] = [];
    let isExecuting = false;

    const execute = async () => {
      isExecuting = true;

      while (queue.length !== 0) {
        for (const index in queue) {
          const [cb, args] = queue[index];
          try {
            await cb(...args);
          } catch (e) {
            throw e;
          } finally {
            queue.splice(+index, 1);
          }
        }
      }

      isExecuting = false;
    };

    const pushQueue = (item: CallbackWithArgs) => {
      queue.push(item);
      if (!isExecuting) execute();
    };

    return async (...args: Parameters<Callback>) => {
      pushQueue([cb, args]);
    };
  }

  /**
   * Call the value and return it if the input is a function or simply return
   * the given value.
   *
   * @param maybeFunction value to check
   * @returns either the given value or the called value if it's a function
   */
  static callIfNeeded<T>(maybeFunction: T): T extends () => infer R ? R : T {
    if (typeof maybeFunction === "function") return maybeFunction();
    return maybeFunction as T extends () => infer R ? R : T;
  }

  /**
   * Fetch the response from the given URL and return the text response.
   *
   * @param url URL
   * @returns the text response
   */
  static async fetchText(url: string) {
    const response = await fetch(url);
    return await response.text();
  }

  /**
   * Fetch the response from the given URL and return the JSON response.
   *
   * @param url URL
   * @returns the JSON response
   */
  static async fetchJSON(url: string) {
    const response = await fetch(url);
    return await response.json();
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
    value ??= {} as T;
    for (const property in defaultValue) {
      const result = defaultValue[property] as AllPartial<T[keyof T]>;
      value[property as keyof T] ??= result as T[keyof T];
    }

    return value as NonNullable<T & D>;
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
   * Convert the given array to an array with unique elements(set).
   *
   * This method doesn't mutate the given array and returns a new array instead.
   *
   * @param array array to convert
   * @returns an array with only the unique elements
   */
  static toUniqueArray<A extends unknown[]>(array: A) {
    return [...new Set(array)] as A;
  }

  /**
   * Split the given array at the given index.
   *
   * # Ranges
   *
   * - First array: `[0, index)`
   * - Second array: `[index, len)`
   *
   * # Example
   *
   * ```ts
   * const result = PgCommon.splitAtIndex(["a", "b", "c"], 1);
   * // [["a"], ["b", "c"]]
   * ```
   *
   * @param array array to split
   * @param index split index
   * @returns the splitted 2 arrays
   */
  static splitAtIndex<A extends unknown[]>(array: A, index: number) {
    return [array.slice(0, index), array.slice(index)] as [A, A];
  }

  /**
   * Filter the array but also return the remaining array.
   *
   * @param array array to filter
   * @param predicate callback function for each of the array elements
   * @returns a tuple of `[filtered, remaining]`
   */
  static filterWithRemaining<T>(
    array: T[],
    predicate: (value: T, index: number) => unknown
  ) {
    return array.reduce(
      (acc, cur, i) => {
        const filterIndex = predicate(cur, i) ? 0 : 1;
        acc[filterIndex].push(cur);
        return acc;
      },
      [[], []] as [T[], T[]]
    );
  }

  /**
   * Split the array to chunks based on the given length.
   *
   * @param array array to split to chunks
   * @param len chunk length
   * @returns the array chunks
   */
  static chunks<T>(array: T[], len: number) {
    return array.reduce((acc, el, i) => {
      const chunkIndex = Math.floor(i / len);
      acc[chunkIndex] ??= [];
      acc[chunkIndex].push(el);
      return acc;
    }, [] as T[][]);
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
   * Get the keys of an object with better types rather than `string[]`.
   *
   * @param obj object
   * @returns the object keys as an array
   */
  static keys<T extends Record<string, unknown>>(obj: T) {
    return Object.keys(obj) as Array<keyof T>;
  }

  /**
   * Get the entries of an object with better types rather than `Array<[string, T]`.
   *
   * @param obj object
   * @returns the object entries as an array of [key, value] tuples
   */
  static entries<T extends Record<string, unknown>>(obj: T) {
    return Object.entries(obj) as Array<[keyof T, ValueOf<T>]>;
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
   * Get the current origin URL with the given `path` appended.
   *
   * @param path URL path
   * @returns the URL based on the current origin
   */
  static getPathUrl(path: string) {
    return PgCommon.joinPaths(window.location.origin, path);
  }

  /**
   * Encode the given content to data URL.
   *
   * @param content content to encode
   * @returns the encoded data URL
   */
  static getDataUrl(content: string | object) {
    if (content instanceof Buffer) {
      return `data:text/plain;base64,${content.toString("base64")}`;
    }
    if (content instanceof Blob) {
      return URL.createObjectURL(content);
    }

    if (typeof content !== "string") {
      content = JSON.stringify(content);
    }

    return "data:text/json;charset=utf-8," + encodeURIComponent(content);
  }

  /**
   * Get the operating system of the user.
   *
   * @returns the operating system of the user
   */
  static getOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) return "Windows";
    if (userAgent.includes("mac")) return "MacOS";
    if (userAgent.includes("linux")) return "Linux";
  }

  /**
   * Change `Ctrl` to `Cmd` if the OS is Mac.
   *
   * @param keybind keybind text
   * @returns the correct text based on OS
   */
  static getKeybindTextOS(keybind: string) {
    if (this.getOS() === "MacOS") {
      keybind = keybind.replace("Ctrl", "Cmd");
    }
    return keybind;
  }

  /**
   * Get the user's browser name.
   *
   * @returns the browser name
   */
  static getBrowser() {
    if ((navigator as any).brave) return "Brave";
    if (navigator.userAgent.includes("Chrome")) return "Chrome";
    if (navigator.userAgent.includes("Firefox")) return "Firefox";
  }

  /**
   * @returns true if the pressed key is `Ctrl` or `Cmd`
   */
  static isKeyCtrlOrCmd(ev: KeyboardEvent) {
    return ev.ctrlKey || ev.metaKey;
  }

  /**
   * @returns whether the given string is parsable to an integer
   */
  static isInt(str: string) {
    const intRegex = /^-?\d+$/;
    if (!intRegex.test(str)) return false;

    const int = parseInt(str, 10);
    return parseFloat(str) === int && !isNaN(int);
  }

  /**
   * @returns whether the given string is parsable to a float
   */
  static isFloat(str: string) {
    const floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(str)) return false;

    const float = parseFloat(str);
    if (isNaN(float)) return false;
    return true;
  }

  /**
   * @returns whether the given string is parsable to a hexadecimal
   */
  static isHex(str: string) {
    const hexRegex = /(0x)?[\da-f]+/i;
    const result = hexRegex.exec(str);
    if (!result) return false;

    return result[0] === str;
  }

  /**
   * @returns whether the given string is parsable to a public key
   */
  static isPk(str: string) {
    // Intentionally not using `web3.PublicKey` to not load `web3.js` at the
    // start of the app

    // Public key length is 43 or 44
    if (!(str.length === 43 || str.length === 44)) return false;

    // Exclude 0, l, I, O
    const base58Regex = /[1-9a-km-zA-HJ-PQ-Z]+/;
    const result = base58Regex.exec(str);
    if (!result) return false;

    return result[0] === str;
  }

  /**
   * @returns whether the given string is parsable to a URL
   */
  static isUrl(str: string) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get whether the given value is non-nullish i.e. **not** `null` or
   * `undefined`.
   *
   * @param value value to check
   * @returns whether the given value is non-nullish
   */
  static isNonNullish<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
  }

  /**
   * Get whether the given value is an asynchronous function.
   *
   * @param value value to check
   * @returns whether the given value is an asynchronous function
   */
  static isAsyncFunction(value: any): value is () => Promise<unknown> {
    return value?.constructor?.name === "AsyncFunction";
  }

  /**
   * Generate a random integer in the range of [`min`, `max`].
   *
   * @param min minimum(inclusive)
   * @param max maximum(inclusive)
   * @returns a random integer between the specified range
   */
  static generateRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Generate a random bigint in the range of [`min`, `max`].
   *
   * @param min minimum(inclusive)
   * @param max maximum(inclusive)
   * @returns a random bigint between the specified range
   */
  static generateRandomBigInt(min: bigint, max: bigint) {
    return (
      new Uint8Array(new BigUint64Array([max - min]).buffer).reduce(
        (acc, cur, i) => {
          if (!cur) return acc;
          return (
            acc +
            BigInt(PgCommon.generateRandomInt(0, cur)) *
              BigInt(2) ** BigInt(8 * i)
          );
        },
        0n
      ) + min
    );
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
   * @returns camelCase converted version of the PascalCase string
   */
  static toCamelFromPascal(str: string) {
    return str[0].toLowerCase() + str.slice(1);
  }

  /**
   * @returns camelCase converted version of the snake_case string
   */
  static toCamelFromSnake(str: string) {
    return PgCommon.toCamelFromPascal(PgCommon.toPascalFromSnake(str));
  }

  /**
   * Convert the given string to snake_case.
   *
   * @returns snake_case converted version of the string
   */
  static toSnakeCase(str: string) {
    return PgCommon.toKebabFromTitle(str).replaceAll("-", "_");
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
   * @returns kebab-case converted version of the snake_case string
   */
  static toKebabFromSnake(str: string) {
    return str.replaceAll("_", "-");
  }

  /**
   * @returns Title Case converted version of the kebab-case string
   */
  static toTitleFromKebab(str: string) {
    return (
      str[0].toUpperCase() +
      str.slice(1).replace(/-\w/, (match) => " " + match[1].toUpperCase())
    );
  }

  /**
   * @returns Title Case converted version of the camelCase string
   */
  static toTitleFromCamel(str: string) {
    return PgCommon.toTitleFromKebab(PgCommon.toKebabFromCamel(str));
  }

  /**
   * @returns Title Case converted version of the snake_case string
   */
  static toTitleFromSnake(str: string) {
    return PgCommon.toTitleFromKebab(PgCommon.toKebabFromSnake(str));
  }

  /**
   * @returns PascalCase converted version of the Title Case string
   */
  static toPascalFromTitle(str: string) {
    return str.replaceAll(" ", "");
  }

  /**
   * @returns PascalCase converted version of the kebab-case string
   */
  static toPascalFromKebab(str: string) {
    return PgCommon.capitalize(str).replace(/-\w/g, (match) => {
      return match[1].toUpperCase();
    });
  }

  /**
   * @returns PascalCase converted version of the snake_case string
   */
  static toPascalFromSnake(str: string) {
    return PgCommon.toPascalFromKebab(PgCommon.toKebabFromSnake(str));
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
      case Endpoint.DEVNET:
        return 5;
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
    eventName: OrString<EventName>;
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
    onChanges: Array<(value: any) => Disposable>,
    opts?: { delay?: number }
  ): Disposable {
    // Intentionally initializing outside of the closure to share `sharedTimeout`
    const debounceOptions = { delay: opts?.delay ?? 0, sharedTimeout: {} };

    const disposables = onChanges.map((onChange) => {
      return onChange(PgCommon.debounce(cb, debounceOptions));
    });

    return {
      dispose: () => disposables.forEach((disposable) => disposable.dispose()),
    };
  }

  /**
   * Execute the given callback initially and on change.
   *
   * This is useful when an on change method doesn't fire an initial change event
   * but the use case requires to run the callback at start.
   *
   * @param onChange on change method
   * @param cb callback to run initially and on change
   * @param args callback arguments
   * @returns a dispose function to clear all events
   */
  static async executeInitial<A extends unknown[]>(
    onChange: (cb: (...args: A) => SyncOrAsync<void>) => Disposable,
    cb: (...args: A) => SyncOrAsync<void>,
    ...args: A
  ) {
    await cb(...args);
    return onChange(cb);
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
   * @param opts options
   * - `accept`: file extensions to accept
   * - `dir`: whether to accept directories
   */
  static async import<T>(
    onChange: (ev: ChangeEvent<HTMLInputElement>) => Promise<T>,
    opts?: { accept?: string; dir?: boolean }
  ): Promise<T> {
    return new Promise((res, rej) => {
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
        el[key] = dirProps[key];
      }

      el.onchange = async (ev) => {
        // @ts-ignore
        const result = await onChange(ev);
        res(result);
      };

      el.oncancel = () => {
        rej({ message: "User cancelled the request" });
      };

      el.click();
    });
  }

  /**
   * Export the given content as a file.
   *
   * @param name name of the exported file
   * @param content content of the exported file
   */
  static export(name: string, content: string | object) {
    const el = document.createElement("a");
    el.download = name;
    el.href = PgCommon.getDataUrl(content);
    el.click();
  }

  /**
   * Change the given input's value and dispatch `change` event correctly.
   *
   * @param inputEl input element
   * @param value input value to set
   */
  static changeInputValue(inputEl: HTMLInputElement, value: string) {
    // `input.value = value` does not trigger `Input` component's `onChange`
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set?.call(inputEl, value);

    // `bubbles: true` is required in order to trigger `onChange`
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
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
   * Join the paths without caring about incorrect '/' inside paths.
   *
   * @param paths paths to join
   * @returns the joined path
   */
  static joinPaths(...paths: string[]) {
    return paths.reduce(
      (acc, cur) => this.appendSlash(acc) + this.withoutPreSlash(cur)
    );
  }

  /**
   * Compare paths to each other.
   *
   * @param pathOne first path
   * @param pathTwo second path
   * @returns whether the paths are equal
   */
  static isPathsEqual(pathOne: string, pathTwo: string) {
    return PgCommon.appendSlash(pathOne) === PgCommon.appendSlash(pathTwo);
  }

  /**
   * Get all of the matches of the `given` value from the `content`.
   *
   * @param content content to match all from
   * @param value value to match
   * @returns the match result
   */
  static matchAll(content: string, value: string | RegExp) {
    return [...content.matchAll(new RegExp(value, "g"))];
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
   * Append "..." to the given `str` after `maxLength` bytes.
   *
   * @param str string to check the max length
   * @param maxLength maximum allowed byte length
   * @returns the original string or the part of the string until the `maxLength`
   */
  static withMaxLength(str: string, maxLength: number) {
    const FILLER = "...";
    if (str.length > maxLength) {
      return str.slice(0, maxLength - FILLER.length) + FILLER;
    }

    return str;
  }

  /**
   * Shorten the given string by only showing the first and last `chars` character.
   *
   * @param str string to shorten
   * @param amount amount of chars to show from beginning and end
   * @returns first and last (default: 3) chars of the given string and '...' in between
   */
  static shorten(str: string, amount: number = 3) {
    return str.slice(0, amount) + "..." + str.slice(-amount);
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
