import type { Idl } from "@coral-xyz/anchor";

import type { TupleFiles } from "./explorer";

/** Rust `Option` type */
type Option<T> = T | null | undefined;

/** `/build` request */
interface BuildRequest {
  /** Program files */
  files: TupleFiles;
  /** UUID of the program */
  uuid?: Option<string>;
  /** Build flags */
  flags?: Option<{
    /** Whether to enable Anchor `seeds` feature */
    seedsFeature?: Option<boolean>;
    /** Whether to remove docs from the Anchor IDL */
    noDocs?: Option<boolean>;
    /** Whether to enable Anchor safety checks */
    safetyChecks?: Option<boolean>;
  }>;
}

/** `/new` request */
interface ShareNewRequest {
  explorer: {
    files: {
      [key: string]: { content?: string };
    };
  };
}

export class PgServer {
  /**
   * Build the program files.
   *
   * @param req build request
   * @returns the build response
   */
  static async build(req: BuildRequest) {
    /** `/build` response */
    interface BuildResponse {
      /** Build output */
      stderr: string;
      /** UUID of the program */
      uuid: string | null;
      /** Anchor IDL */
      idl: Idl | null;
    }

    const response = await this._send("/build", {
      post: { body: JSON.stringify(req) },
    });

    return (await response.json()) as BuildResponse;
  }

  /**
   * Get the program ELF.
   *
   * NOTE: The server is only responsible for sending the program binary to the
   * client. The deployment process is done in the client.
   *
   * @param uuid unique project id
   * @returns the program ELF as `Buffer`
   */
  static async deploy(uuid: string) {
    const response = await this._send(`/deploy/${uuid}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get the shared project information.
   *
   * @param id share id
   * @returns the shared project response
   */
  static async shareGet(id: string) {
    /** `/share` response */
    type ShareResponse = ShareNewRequest["explorer"];

    const response = await this._send(`/share/${id}`, { cache: true });
    return (await response.json()) as ShareResponse;
  }

  /**
   * Share a new project.
   *
   * @param req share request
   * @returns the unique share id
   */
  static async shareNew(req: ShareNewRequest) {
    /** `/new` response is the share id */
    type ShareNewResponse = string;

    const response = await this._send("/new", {
      post: { body: JSON.stringify(req) },
    });

    return (await response.text()) as ShareNewResponse;
  }

  /** Default playground server URL */
  private static readonly _DEFAULT_SERVER_URL = "https://api.solpg.io";

  /** Server URL that is customizable from environment variables */
  private static readonly _SERVER_URL =
    process.env.NODE_ENV === "production"
      ? this._DEFAULT_SERVER_URL
      : process.env.REACT_APP_SERVER_URL ?? this._DEFAULT_SERVER_URL;

  /**
   * Send an HTTP request to the Playground server.
   *
   * @throws when the response is not OK with the decoded response
   * @returns the HTTP response
   */
  private static async _send(
    path: string,
    options?: { post?: { body: string }; cache?: boolean }
  ) {
    const requestInit: RequestInit = {};

    if (options?.post) {
      requestInit.method = "POST";
      requestInit.headers = {
        "Content-Type": "application/json",
      };
      requestInit.body = options.post.body;
    }

    if (!options?.cache) {
      requestInit.cache = "no-store";
    }

    const response = await fetch(`${this._SERVER_URL}${path}`, requestInit);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }

    return response;
  }
}
