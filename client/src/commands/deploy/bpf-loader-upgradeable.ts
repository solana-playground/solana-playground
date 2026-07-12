import {
  PgCommon,
  PgConnection,
  PgTx,
  PgWallet,
  PgWeb3,
  WalletOption,
} from "../../utils";

/** Wrapper around `BpfLoaderUpgradeableProgram` for easier interactions */
export class BpfLoaderUpgradeable {
  /** Create and initialize a buffer account. */
  static async createBuffer(
    buffer: PgWeb3.Signer,
    lamports: number,
    programLen: number,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const ixs = [
      PgWeb3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: buffer.publicKey,
        lamports,
        space:
          PgWeb3.BpfLoaderUpgradeableProgram.getBufferAccountSize(programLen),
        programId: PgWeb3.BpfLoaderUpgradeableProgram.programId,
      }),
      PgWeb3.BpfLoaderUpgradeableProgram.initializeBuffer({
        bufferPk: buffer.publicKey,
        authorityPk: wallet.publicKey,
      }),
    ];

    return await PgTx.send(ixs, { keypairSigners: [buffer], wallet });
  }

  /** Update the buffer authority. */
  static async setBufferAuthority(
    bufferPk: PgWeb3.PublicKey,
    newAuthorityPk: PgWeb3.PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const ix = PgWeb3.BpfLoaderUpgradeableProgram.setBufferAuthority({
      bufferPk,
      authorityPk: wallet.publicKey,
      newAuthorityPk,
    });

    return await PgTx.send(ix, { wallet });
  }

  /** Load programData to the initialized buffer account. */
  static async loadBuffer(
    bufferPk: PgWeb3.PublicKey,
    programData: Buffer,
    opts?: {
      loadConcurrency?: number;
      abortController?: AbortController;
      onWrite?: (offset: number) => void;
      onMissing?: (missingCount: number) => void;
      onRateLimit?: () => void;
    } & WalletOption
  ) {
    const { wallet } = this._getOptions(opts);
    const { loadConcurrency } = PgCommon.setDefault(opts, {
      loadConcurrency: 8,
    });
    const connection = PgConnection.current;

    // Maximal chunk of the data per tx
    const WRITE_CHUNK_SIZE =
      PgWeb3.PACKET_DATA_SIZE - // Maximum transaction size
      220 - //                     Data with 1 signature
      44 - //                      `setComputeUnitPrice` instruction size
      40; //                       `setComputeUnitLimit` instruction size

    // Simulate to get the compute unit consumption of a write transaction and
    // reuse it for all writes since they all consume the same amount of CU
    const { unitsConsumed: computeUnitLimit } = await PgTx.simulate(
      PgWeb3.BpfLoaderUpgradeableProgram.write({
        offset: 0,
        bytes: programData.slice(0, WRITE_CHUNK_SIZE),
        bufferPk,
        authorityPk: wallet.publicKey,
      }),
      { computeUnitLimit: PgWeb3.MAX_COMPUTE_UNIT_LIMIT, wallet }
    );

    const loadBuffer = async (indices: number[], isMissing?: boolean) => {
      if (isMissing) opts?.onMissing?.(indices.length);

      let i = 0;
      let lastTxHash: string | undefined;
      let isRateLimited = false;
      await Promise.all(
        new Array(loadConcurrency).fill(null).map(async () => {
          while (1) {
            if (opts?.abortController?.signal.aborted) return;
            if (isRateLimited) break;

            const offset = indices[i] * WRITE_CHUNK_SIZE;
            i++;
            const endOffset = offset + WRITE_CHUNK_SIZE;
            const bytes = programData.slice(offset, endOffset);
            if (bytes.length === 0) break;

            const ix = PgWeb3.BpfLoaderUpgradeableProgram.write({
              offset,
              bytes,
              bufferPk,
              authorityPk: wallet.publicKey,
            });

            try {
              lastTxHash = await PgTx.send(ix, { wallet, computeUnitLimit });
              if (!isMissing) opts?.onWrite?.(endOffset);
            } catch (e: any) {
              if (isRateLimited) break;

              console.log("Buffer write error:", e);
              if (!(e instanceof Error)) continue;

              // Naively parse the error message. Example error message for rate limits:
              // `429 :  {"jsonrpc":"2.0","error":{"code": 429, "message":"Too many requests for a specific RPC call"}, "id": "1840af2d-8e39-494a-8e3f-69ca0099d4e4" } \r\n`
              const msg = e.message.trim();
              const maybeResponseStr = msg.substring(
                msg.indexOf("{"),
                msg.lastIndexOf("}") + 1
              );
              try {
                const response = JSON.parse(maybeResponseStr);
                isRateLimited = response.error?.code === 429;
                if (isRateLimited) break;
              } catch {}
            }
          }
        })
      );
      if (opts?.abortController?.signal.aborted) return;

      // TODO: Make use of the `X-Ratelimit-Method-Remaining` response header.
      // At the time of writing this comment, the default devnet RPC sets 150
      // for `X-Ratelimit-Method-Limit`, but it only allows 40 requests in
      // reality. This matches `...Conn-Limit` and `...Connrate-Limit`, but
      // their `*-Remaining` counterparts do not decrease with each request;
      // when `...Method-Remaining` falls to 110, the next request triggers to
      // the same RPC method triggers the rate limit.
      if (isRateLimited) {
        opts?.onRateLimit?.();
        await PgCommon.sleep(10_000);
      }

      // Wait for the last transaction to confirm
      if (lastTxHash) {
        try {
          await PgTx.confirm(lastTxHash);
        } catch {
          const confirmations = connection.commitment === "finalized" ? 32 : 1;
          await PgCommon.sleep(confirmations * PgWeb3.DEFAULT_MS_PER_SLOT);
        }
      }
    };

    const txCount = Math.ceil(programData.length / WRITE_CHUNK_SIZE);
    const indices = new Array(txCount).fill(null).map((_, i) => i);
    let isMissing = false;

    // Retry until all bytes are written
    while (1) {
      if (opts?.abortController?.signal.aborted) return;

      // Even though we only get to this function after buffer account creation
      // gets confirmed, the RPC can still return `null` here if it's behind.
      const bufferAccount = await PgCommon.tryUntilSuccess(async () => {
        const acc = await connection.getAccountInfo(bufferPk);
        if (!acc) throw new Error();
        return acc;
      }, 1000);

      const onChainProgramData = bufferAccount.data.slice(
        PgWeb3.BpfLoaderUpgradeableProgram.BUFFER_METADATA_SIZE,
        PgWeb3.BpfLoaderUpgradeableProgram.BUFFER_METADATA_SIZE +
          programData.length
      );
      if (onChainProgramData.equals(programData)) break;

      const missingIndices = indices.filter((i) => {
        const start = i * WRITE_CHUNK_SIZE;
        const end = start + WRITE_CHUNK_SIZE;
        const actualSlice = programData.slice(start, end);
        const onChainSlice = onChainProgramData.slice(start, end);
        return !actualSlice.equals(onChainSlice);
      });
      await loadBuffer(missingIndices, isMissing);
      isMissing = true;
    }
  }

  /** Close the buffer account and withdraw funds. */
  static async closeBuffer(bufferPk: PgWeb3.PublicKey, opts?: WalletOption) {
    const { wallet } = this._getOptions(opts);

    const ix = PgWeb3.BpfLoaderUpgradeableProgram.close({
      closePk: bufferPk,
      recipientPk: wallet.publicKey,
      authorityPk: wallet.publicKey,
    });

    return await PgTx.send(ix, { wallet });
  }

  /** Create a program account from initialized buffer. */
  static async deployProgram(
    program: PgWeb3.Signer,
    bufferPk: PgWeb3.PublicKey,
    maxDataLen: number,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const ixs = [
      PgWeb3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: program.publicKey,
        lamports: await PgConnection.current.getMinimumBalanceForRentExemption(
          PgWeb3.BpfLoaderUpgradeableProgram.PROGRAM_ACCOUNT_SIZE
        ),
        space: PgWeb3.BpfLoaderUpgradeableProgram.PROGRAM_ACCOUNT_SIZE,
        programId: PgWeb3.BpfLoaderUpgradeableProgram.programId,
      }),
      PgWeb3.BpfLoaderUpgradeableProgram.deployWithMaxProgramLen({
        programPk: program.publicKey,
        bufferPk,
        upgradeAuthorityPk: wallet.publicKey,
        payerPk: wallet.publicKey,
        maxDataLen,
      }),
    ];

    return await PgTx.send(ixs, { wallet, keypairSigners: [program] });
  }

  /** Extend the program data account. */
  static async extendProgram(
    programPk: PgWeb3.PublicKey,
    additionalBytes: number,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const ix = PgWeb3.BpfLoaderUpgradeableProgram.extendProgram({
      programPk,
      additionalBytes,
      payerPk: wallet.publicKey,
    });

    return await PgTx.send(ix, { wallet });
  }

  /** Upgrade a program. */
  static async upgradeProgram(
    programPk: PgWeb3.PublicKey,
    bufferPk: PgWeb3.PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const ix = PgWeb3.BpfLoaderUpgradeableProgram.upgrade({
      programPk,
      bufferPk,
      authorityPk: wallet.publicKey,
      spillPk: wallet.publicKey,
    });

    return await PgTx.send(ix, { wallet });
  }

  /** Get the connection and wallet instance. */
  private static _getOptions(opts?: WalletOption) {
    const wallet = opts?.wallet ?? PgWallet.current;
    if (!wallet) throw new Error("Wallet is not connected");

    return { wallet };
  }
}
