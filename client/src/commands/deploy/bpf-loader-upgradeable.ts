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
    } & WalletOption
  ) {
    const { wallet } = this._getOptions(opts);
    const { loadConcurrency } = PgCommon.setDefault(opts, {
      loadConcurrency: 8,
    });

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
      { computeUnitLimit: PgWeb3.MAX_COMPUTE_UNIT_LIMIT }
    );

    const loadBuffer = async (indices: number[], isMissing?: boolean) => {
      if (isMissing) opts?.onMissing?.(indices.length);

      let i = 0;
      await Promise.all(
        new Array(loadConcurrency).fill(null).map(async () => {
          while (1) {
            if (opts?.abortController?.signal.aborted) return;

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
              await PgTx.send(ix, { wallet, computeUnitLimit });
              if (!isMissing) opts?.onWrite?.(endOffset);
            } catch (e: any) {
              console.log("Buffer write error:", e.message);
            }
          }
        })
      );
    };

    const txCount = Math.ceil(programData.length / WRITE_CHUNK_SIZE);
    const indices = new Array(txCount).fill(null).map((_, i) => i);
    let isMissing = false;

    // Retry until all bytes are written
    while (1) {
      if (opts?.abortController?.signal.aborted) return;

      // Wait for last transaction to confirm
      await PgCommon.sleep(500);

      // Even though we only get to this function after buffer account creation
      // gets confirmed, the RPC can still return `null` here if it's behind.
      const bufferAccount = await PgCommon.tryUntilSuccess(async () => {
        const acc = await PgConnection.current.getAccountInfo(bufferPk);
        if (!acc) throw new Error();
        return acc;
      }, 2000);

      const onChainProgramData = bufferAccount.data.slice(
        PgWeb3.BpfLoaderUpgradeableProgram.BUFFER_ACCOUNT_METADATA_SIZE,
        PgWeb3.BpfLoaderUpgradeableProgram.BUFFER_ACCOUNT_METADATA_SIZE +
          programData.length
      );
      if (onChainProgramData.equals(programData)) break;

      const missingIndices = indices
        .map((i) => {
          const start = i * WRITE_CHUNK_SIZE;
          const end = start + WRITE_CHUNK_SIZE;
          const actualSlice = programData.slice(start, end);
          const onChainSlice = onChainProgramData.slice(start, end);
          if (!actualSlice.equals(onChainSlice)) return i;
          return null;
        })
        .filter(PgCommon.isNonNullish);
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
    programLamports: number,
    maxDataLen: number,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const ixs = [
      PgWeb3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: program.publicKey,
        lamports: programLamports,
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

  /** Update the program authority. */
  static async setProgramAuthority(
    programPk: PgWeb3.PublicKey,
    newAuthorityPk?: PgWeb3.PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const ix = PgWeb3.BpfLoaderUpgradeableProgram.setUpgradeAuthority({
      programPk,
      authorityPk: wallet.publicKey,
      newAuthorityPk,
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

  /** Close the program account and withdraw funds. */
  static async closeProgram(programPk: PgWeb3.PublicKey, opts?: WalletOption) {
    const { wallet } = this._getOptions(opts);

    const ix = PgWeb3.BpfLoaderUpgradeableProgram.close({
      closePk:
        PgWeb3.BpfLoaderUpgradeableProgram.getProgramDataAddress(programPk),
      recipientPk: wallet.publicKey,
      authorityPk: wallet.publicKey,
      programPk,
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
