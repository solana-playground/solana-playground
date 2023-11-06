import type { Idl } from "@coral-xyz/anchor";

import type { TupleFiles } from "./explorer";

export interface ShareData {
  files: {
    [key: string]: {
      content?: string;
      current?: boolean;
      tabs?: boolean;
    };
  };
}

export class PgServer {
  /**
   * Build the program files.
   *
   * @param files files to send to the server
   * @param uuid unique project id
   * @returns the build response
   */
  static async build(files: TupleFiles, uuid: string | null) {
    const response = await this._send("/build", {
      post: {
        body: JSON.stringify({
          files,
          uuid,
        }),
      },
    });

    interface BuildResponse {
      stderr: string;
      uuid: string | null;
      idl: Idl | null;
    }

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
    const response = await this._send(`/share/${id}`);
    return (await response.json()) as ShareData;
  }

  /**
   * Share a new project.
   *
   * @param data project information in JSON format
   * @returns the unique share id
   */
  static async shareNew(data: ShareData) {
    const response = await this._send("/new", {
      post: {
        body: JSON.stringify({
          explorer: data,
        }),
      },
    });

    const shareId = await response.text();
    return shareId;
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
    options?: { post?: { body: string } }
  ) {
    let requestInit: RequestInit = {};
    if (options?.post) {
      requestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: options.post.body,
      };
    }
    const response = await fetch(`${this._SERVER_URL}${path}`, requestInit);

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }

    return response;
  }
}
