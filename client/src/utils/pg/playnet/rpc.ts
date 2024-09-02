import type { PgRpc, TransactionStatus } from "@solana-playground/playnet";

import { PgSerde } from "./serde";
import { PgPlaynetUtils } from "./utils";
import { PgBytes } from "../bytes";
import { PgCommon } from "../common";
import { PgConnection } from "../connection";
import { PgSettings } from "../settings";
import { Endpoint } from "../../../constants";
import type {
  OverridableConnection,
  RpcRequest,
  RpcResponse,
  RpcResponseWithContext,
} from "./types";
import { PgWeb3 } from "../web3";

export class PgPlaynetRpc {
  /**
   * Get whether the given URL belongs to Playnet.
   *
   * @param url RPC endpoint
   * @returns whether the given URL starts with `Endpoint.PLAYNET`
   */
  static isUrlPlaynet(url: string = PgSettings.connection.endpoint) {
    return url.startsWith(Endpoint.PLAYNET);
  }

  /**
   * Create a Playnet compatible connection instance.
   *
   * If `playnet` is specified:
   * 1. `window.fetch` will be overridden with a Playnet compatible method.
   * 2. A new connection instance will be created.
   * 3. The connection instance will be overridden to make it compatible with
   * Playnet.
   * 4. The connection instance will be returned.
   *
   * If `playnet` is **NOT** specified:
   * 1. `window.fetch` will be overridden with the default `fetch` method.
   * 2. `null` will be returned.
   *
   * @param rpc Playnet RPC
   * @returns the overridden connection or `null`
   */
  static overrideConnection(rpc?: PgRpc) {
    // Override `window.fetch`
    const newFetch = this._overrideFetch(rpc);

    // Return early if `playnet` doesn't exist
    if (!rpc) return null;

    // Override connection to make it compatible with Playnet
    const connection: OverridableConnection = PgConnection.create({
      fetch: newFetch,
    });

    // @ts-ignore
    connection.confirmTransaction = async (
      ...params: Parameters<PgWeb3.Connection["confirmTransaction"]>
    ) => {
      let signature;
      if (typeof params[0] === "string") {
        signature = params[0];
      } else {
        const strat =
          params[0] as PgWeb3.BlockheightBasedTransactionConfirmationStrategy;
        signature = strat.signature;
      }

      const result = rpc.getSignatureStatuses([signature]);
      const status: TransactionStatus | undefined = result.statuses()[0];
      if (!status) throw new Error("Transaction not found.");

      return {
        value: { err: status.error() ?? null },
        context: { slot: PgCommon.bigintToInt(rpc.getSlot()) },
      };
    };

    // @ts-ignore
    connection.onAccountChange = (
      ...params: Parameters<PgWeb3.Connection["onAccountChange"]>
    ) => {
      const address = params[0].toBase58();
      const cb = params[1];

      let currentAccountInfo = PgPlaynetUtils.convertAccountInfo(
        rpc.getAccountInfo(address)
      );

      const id = PgCommon.setIntervalOnFocus(() => {
        const newAccountInfo = PgPlaynetUtils.convertAccountInfo(
          rpc.getAccountInfo(address)
        );

        if (!PgCommon.isEqual(currentAccountInfo, newAccountInfo)) {
          cb(newAccountInfo, {
            slot: PgCommon.bigintToInt(rpc.getSlot()),
          });

          currentAccountInfo = newAccountInfo;
        }
      }, 3000);

      return id;
    };

    connection.removeAccountChangeListener = async (
      ...params: Parameters<PgWeb3.Connection["removeAccountChangeListener"]>
    ) => {
      const [id] = params;
      clearInterval(id);
    };

    // `Connection` is not ready until this property is set
    connection.overridden = true;

    return connection;
  }

  /**
   * Override `window.fetch` method.
   *
   * @param rpc Playnet RPC. The default `fetch` will be used if `undefined`.
   * @returns the new or the default `fetch` method
   */
  private static _overrideFetch(rpc?: PgRpc) {
    let newFetch;
    if (rpc) {
      newFetch = this._getNewFetch(rpc);
    } else {
      newFetch = defaultFetch;
    }

    // WASM client uses global `fetch` method
    window.fetch = newFetch;

    return newFetch;
  }

  /**
   * Create a new `fetch` function that detects and rebinds the requests of
   * Solana JSON-RPC methods.
   */
  private static _getNewFetch(rpc: PgRpc) {
    return async (...args: Parameters<Window["fetch"]>) => {
      // Get whether the request url is playnet
      let parsedRequest: RpcRequest | null = null;
      if (typeof args[0] === "string") {
        const url = args[0];
        if (this.isUrlPlaynet(url)) {
          const requestBody = args[1]?.body;
          if (requestBody) {
            parsedRequest = JSON.parse(requestBody.toString());
          }
        }
      } else if (typeof args[0] === "object") {
        const request = args[0] as Request;
        if (this.isUrlPlaynet(request.url)) {
          parsedRequest = await request.json();
        }
      }

      // Playnet response
      if (parsedRequest) return this._getPlaynetResponse(rpc, parsedRequest);

      // Response for every URL other than Playnet endpoint
      return await defaultFetch(...args);
    };
  }

  /**
   * Create Solana JSON-RPC compatible RPC response for Playnet.
   *
   * This implementation allows Playnet to be used with `Connection` like a
   * normal cluster.
   */
  private static _getPlaynetResponse(rpc: PgRpc, request: RpcRequest) {
    const slot = PgCommon.bigintToInt(rpc.getSlot());
    const context = {
      apiVersion: "1.15.0",
      slot,
    };

    switch (request.method) {
      case "getAccountInfo": {
        const [address] = request.params;
        const account = rpc.getAccountInfo(address);
        const lamports = PgCommon.bigintToInt(account.lamports);

        return this._createRpcResponse<"getAccountInfo">(request, context, {
          // @ts-ignore
          value:
            lamports === 0
              ? null
              : {
                  data: [PgBytes.toBase64(Buffer.from(account.data)), "base64"],
                  executable: account.executable,
                  lamports,
                  owner: new PgWeb3.PublicKey(account.owner.toBytes()),
                  rentEpoch: PgCommon.bigintToInt(account.rentEpoch),
                },
        });
      }

      case "getBalance": {
        const [address] = request.params;
        const account = rpc.getAccountInfo(address);
        return this._createRpcResponse<"getBalance">(request, context, {
          value: PgCommon.bigintToInt(account.lamports),
        });
      }

      case "getBlockHeight": {
        return this._createRpcResponse<"getBlockHeight">(request, context, {
          result: PgCommon.bigintToInt(rpc.getBlockHeight()),
        });
      }

      case "getFeeForMessage": {
        const [msgBase64] = request.params;
        const rustMsgBytes = PgSerde.serializeMsg(msgBase64);

        const fee = PgCommon.bigintToInt(rpc.getFeeForMessage(rustMsgBytes));

        return this._createRpcResponse<"getFeeForMessage">(request, context, {
          result:
            fee === undefined
              ? undefined
              : {
                  context: { slot },
                  value: fee,
                },
        });
      }

      case "getGenesisHash": {
        return this._createRpcResponse<"getGenesisHash">(request, context, {
          result: rpc.getGenesisHash(),
        });
      }

      case "getLatestBlockhash": {
        const blockhashInfo = rpc.getLatestBlockhash();
        return this._createRpcResponse<"getLatestBlockhash">(request, context, {
          value: {
            blockhash: blockhashInfo.blockhash(),
            lastValidBlockHeight: PgCommon.bigintToInt(
              blockhashInfo.lastValidBlockHeight()
            ),
          },
        });
      }

      case "getMinimumBalanceForRentExemption": {
        const [dataLen] = request.params;
        return this._createRpcResponse<"getMinimumBalanceForRentExemption">(
          request,
          context,
          {
            result: PgCommon.bigintToInt(
              rpc.getMinimumBalanceForRentExemption(dataLen)
            ),
          }
        );
      }

      case "getRecentBlockhash": {
        return this._createRpcResponse<"getRecentBlockhash">(request, context, {
          value: {
            blockhash: rpc.getLatestBlockhash().blockhash(),
            feeCalculator: { lamportsPerSignature: 5000 },
          },
        });
      }

      case "getSignatureStatuses": {
        const [signatures] = request.params;

        const statusesResult = rpc.getSignatureStatuses(signatures);
        const statuses: (TransactionStatus | undefined)[] =
          statusesResult.statuses();

        return this._createRpcResponse<"getSignatureStatuses">(
          request,
          context,
          {
            result: {
              context,
              value: statuses.map((status) =>
                status
                  ? {
                      confirmationStatus: (() => {
                        switch (status.confirmationStatus) {
                          case 0:
                            return "processed";
                          case 1:
                            return "confirmed";
                          case 2:
                            return "finalized";
                          default:
                            return "finalized";
                        }
                      })() as PgWeb3.TransactionConfirmationStatus,
                      confirmations: status.confirmations!,
                      err: status.error() ?? null,
                      slot: PgCommon.bigintToInt(status.slot),
                    }
                  : null
              ),
            },
          }
        );
      }

      case "getSlot": {
        return this._createRpcResponse<"getSlot">(request, context, {
          result: slot,
        });
      }

      case "getTransaction": {
        const [signature, options] = request.params;
        const getTxResult = rpc.getTransaction(signature);

        const meta = getTxResult.meta();

        // web3.js expects tx object but solana-cli expects base64 encoded tx
        // string. We get base64 tx string from `playnet` and convert it to
        // `VersionedTransaction`
        let tx:
          | [string, string]
          | PgWeb3.VersionedTransactionResponse["transaction"] = [
          getTxResult.transaction(),
          "base64",
        ];
        if (!options?.encoding) {
          const versionedTx = PgWeb3.VersionedTransaction.deserialize(
            PgBytes.fromBase64(tx[0])
          );

          const signatures = versionedTx.signatures.map((signatureBytes) => {
            return PgBytes.toBase58(Buffer.from(signatureBytes));
          });

          tx = {
            message: versionedTx.message,
            signatures,
          };
        }

        const convertBalances = (bigintBalances: BigUint64Array) => {
          const balances = [];
          for (const i in bigintBalances) {
            balances.push(PgCommon.bigintToInt(bigintBalances[i]));
          }

          return balances;
        };

        return this._createRpcResponse<"getTransaction">(request, context, {
          // @ts-ignore
          result: getTxResult.exists()
            ? {
                slot,
                transaction: tx,
                meta: {
                  fee: PgCommon.bigintToInt(meta.fee()),
                  innerInstructions: meta.innerInstructions(),
                  preBalances: convertBalances(meta.preBalances()),
                  postBalances: convertBalances(meta.postBalances()),
                  logMessages: meta.logs(),
                  preTokenBalances: meta.preTokenBalances(),
                  postTokenBalances: meta.postTokenBalances(),
                  err: meta.err() ?? null,
                  loadedAddresses: meta.loadedAddresses(),
                  computeUnitsConsumed: PgCommon.bigintToInt(
                    meta.computeUnitsConsumed()
                  ),
                  rewards: [],
                  status: meta.err() ? { Err: meta.err() } : { Ok: null },
                },
                blockTime: PgCommon.bigintToInt(getTxResult.blockTime()),
                version: getTxResult.version() ?? "legacy",
              }
            : null,
        });
      }

      case "requestAirdrop": {
        const [address, lamports] = request.params;
        const airdropResult = rpc.requestAirdrop(address, BigInt(lamports));
        this._handleError(airdropResult);

        return this._createRpcResponse<"requestAirdrop">(request, context, {
          result: airdropResult.txHash(),
        });
      }

      case "sendTransaction": {
        const [txBase64] = request.params;
        const rustTxBytes = PgSerde.serializeTx(txBase64);

        const txResult = rpc.sendTransaction(rustTxBytes);
        this._handleError(txResult);

        return this._createRpcResponse<"sendTransaction">(request, context, {
          result: txResult.txHash(),
        });
      }

      case "simulateTransaction": {
        const [txBase64] = request.params;
        const rustTxBytes = PgSerde.serializeTx(txBase64);

        const simulationResult = rpc.simulateTransaction(rustTxBytes);

        const returnData = simulationResult.returnData();

        return this._createRpcResponse<"simulateTransaction">(
          request,
          context,
          {
            result: {
              context,
              value: {
                err: simulationResult.error() ?? null,
                logs: simulationResult.logs(),
                unitsConsumed: PgCommon.bigintToInt(
                  simulationResult.unitsConsumed()
                ),
                returnData: returnData
                  ? {
                      programId: returnData.programId.toString(),
                      data: [
                        PgBytes.toBase64(Buffer.from(returnData.data)),
                        "base64",
                      ],
                    }
                  : null,
                accounts: null,
              },
            },
          }
        );
      }

      default: {
        throw new Error(`Method: '${request.method}' is not yet implemented.`);
      }
    }
  }

  /** Create `web3.js` compatible responses with type safety. */
  private static _createRpcResponse<K extends keyof PgWeb3.Connection>(
    request: RpcRequest,
    context: RpcResponseWithContext<K>["result"]["context"],
    data: {
      result?: RpcResponse<K>["result"];
      value?: RpcResponseWithContext<K>["result"]["value"];
    }
  ) {
    const responseBody: RpcResponse<K> | RpcResponseWithContext<K> = {
      id: request.id,
      jsonrpc: request.jsonrpc,
      result:
        data.result !== undefined
          ? data.result!
          : {
              context,
              value: data.value!,
            },
    };

    // WASM URL parsing fails if the `Response.url` is empty
    return Object.defineProperty(
      new Response(JSON.stringify(responseBody)),
      "url",
      { value: Endpoint.PLAYNET }
    );
  }

  /**
   * Handle WASM errors.
   *
   * @param result WASM result object that has `error()` method
   */
  private static _handleError<R extends { error: () => string | undefined }>(
    result: R
  ) {
    const error = result.error();
    if (error) {
      throw new Error(error);
    }
  }
}

/** Default `window.fetch` method */
const defaultFetch = fetch;
