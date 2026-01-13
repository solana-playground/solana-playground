// Thanks to @fanatid

import * as BufferLayout from "@solana/buffer-layout";

import * as Layout from "./layout";
import { PgCommon } from "../common";
import { ConnectionOption, PgConnection } from "../connection";
import { PgTx } from "../tx";
import { PgWallet, WalletOption } from "../wallet";
import { PgWeb3 } from "../web3";

export const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PgWeb3.PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

/** Initialize buffer tx params */
type InitializeBufferParams = {
  /** Public key of the buffer account */
  bufferPk: PgWeb3.PublicKey;
  /** Public key to set as authority of the initialized buffer */
  authorityPk: PgWeb3.PublicKey;
};

/** Write tx params */
type WriteParams = {
  /** Offset at which to write the given bytes. */
  offset: number;
  /** Chunk of program data */
  bytes: Buffer;
  /** Public key of the buffer account */
  bufferPk: PgWeb3.PublicKey;
  /** Public key to set as authority of the initialized buffer */
  authorityPk: PgWeb3.PublicKey;
};

/** Deploy program tx params */
type DeployWithMaxProgramLenParams = {
  /** Maximum length that the program can be upgraded to. */
  maxDataLen: number;
  /** The uninitialized Program account */
  programPk: PgWeb3.PublicKey;
  /** The buffer account where the program data has been written. The buffer account’s authority must match the program’s authority */
  bufferPk: PgWeb3.PublicKey;
  /** The program’s authority */
  upgradeAuthorityPk: PgWeb3.PublicKey;
  /** The payer account that will pay to create the ProgramData account */
  payerPk: PgWeb3.PublicKey;
};

/** Upgrade tx params */
type UpgradeParams = {
  /** The program account */
  programPk: PgWeb3.PublicKey;
  /** The buffer account where the program data has been written. The buffer account’s authority must match the program’s authority */
  bufferPk: PgWeb3.PublicKey;
  /** The spill account */
  spillPk: PgWeb3.PublicKey;
  /** The program’s authority */
  authorityPk: PgWeb3.PublicKey;
};

/** Update buffer authority tx params */
type SetBufferAuthorityParams = {
  /** The buffer account where the program data has been written */
  bufferPk: PgWeb3.PublicKey;
  /** The buffer's authority */
  authorityPk: PgWeb3.PublicKey;
  /** New buffer's authority */
  newAuthorityPk: PgWeb3.PublicKey;
};

/** Update program authority tx params */
type SetUpgradeAuthorityParams = {
  /** The program account */
  programPk: PgWeb3.PublicKey;
  /** The current authority */
  authorityPk: PgWeb3.PublicKey;
  /** The new authority, optional, if omitted then the program will not be upgradable */
  newAuthorityPk?: PgWeb3.PublicKey;
};

/** Close account tx params */
type CloseParams = {
  /** The account to close */
  closePk: PgWeb3.PublicKey;
  /** The account to deposit the closed account’s lamports */
  recipientPk: PgWeb3.PublicKey;
  /** The account’s authority, Optional, required for initialized accounts */
  authorityPk?: PgWeb3.PublicKey;
  /** The associated Program account if the account to close is a ProgramData account */
  programPk?: PgWeb3.PublicKey;
};

/**
 * Factory class for txs to interact with the BpfLoaderUpgradeable program
 */
class BpfLoaderUpgradeableProgram {
  /** Public key that identifies the BpfLoaderUpgradeable program */
  static programId = BPF_LOADER_UPGRADEABLE_PROGRAM_ID;

  /** Derive the program data address from the given program address. */
  static getProgramDataAddress(programPk: PgWeb3.PublicKey) {
    return PgWeb3.PublicKey.findProgramAddressSync(
      [programPk.toBuffer()],
      this.programId
    )[0];
  }

  /** Generate a tx instruction that initialize buffer account. */
  static initializeBuffer(params: InitializeBufferParams) {
    const data = this._encodeData(
      {
        discriminator: 0,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
        ]),
      },
      {}
    );

    return new PgWeb3.TransactionInstruction({
      keys: [
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        { pubkey: params.authorityPk, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });
  }

  /**
   * Generate a tx instruction that write a chunk of program data to a buffer
   * account.
   */
  static write(params: WriteParams) {
    const data = this._encodeData(
      {
        discriminator: 1,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
          BufferLayout.u32("offset"),
          Layout.rustVecBytes("bytes"),
        ]),
      },
      { offset: params.offset, bytes: params.bytes }
    );

    return new PgWeb3.TransactionInstruction({
      keys: [
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        { pubkey: params.authorityPk, isSigner: true, isWritable: false },
      ],
      programId: this.programId,
      data,
    });
  }

  /**
   * Generate a tx instruction that deploy a program with a specified maximum
   * program length.
   */
  static deployWithMaxProgramLen(params: DeployWithMaxProgramLenParams) {
    const data = this._encodeData(
      {
        discriminator: 2,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
          BufferLayout.u32("maxDataLen"),
          BufferLayout.u32("maxDataLenPadding"),
        ]),
      },
      { maxDataLen: params.maxDataLen, maxDataLenPadding: 0 }
    );

    const programDataPk = this.getProgramDataAddress(params.programPk);

    return new PgWeb3.TransactionInstruction({
      keys: [
        { pubkey: params.payerPk, isSigner: true, isWritable: true },
        { pubkey: programDataPk, isSigner: false, isWritable: true },
        { pubkey: params.programPk, isSigner: false, isWritable: true },
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        {
          pubkey: PgWeb3.SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: PgWeb3.SYSVAR_CLOCK_PUBKEY,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: PgWeb3.SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: params.upgradeAuthorityPk,
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: this.programId,
      data,
    });
  }

  /** Generate a tx instruction that upgrade a program. */
  static upgrade(params: UpgradeParams) {
    const data = this._encodeData(
      {
        discriminator: 3,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
        ]),
      },
      {}
    );

    const programDataPk = this.getProgramDataAddress(params.programPk);

    return new PgWeb3.TransactionInstruction({
      keys: [
        { pubkey: programDataPk, isSigner: false, isWritable: true },
        { pubkey: params.programPk, isSigner: false, isWritable: true },
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        { pubkey: params.spillPk, isSigner: true, isWritable: true },
        {
          pubkey: PgWeb3.SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: PgWeb3.SYSVAR_CLOCK_PUBKEY,
          isSigner: false,
          isWritable: false,
        },
        { pubkey: params.authorityPk, isSigner: true, isWritable: false },
      ],
      programId: this.programId,
      data,
    });
  }

  /** Generate a tx instruction that set a new buffer authority. */
  static setBufferAuthority(params: SetBufferAuthorityParams) {
    const data = this._encodeData(
      {
        discriminator: 4,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
        ]),
      },
      {}
    );

    return new PgWeb3.TransactionInstruction({
      keys: [
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        { pubkey: params.authorityPk, isSigner: true, isWritable: false },
        { pubkey: params.newAuthorityPk, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });
  }

  /** Generate a tx instruction that set a new program authority. */
  static setUpgradeAuthority(params: SetUpgradeAuthorityParams) {
    const data = this._encodeData(
      {
        discriminator: 4,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
        ]),
      },
      {}
    );

    const programDataPk = this.getProgramDataAddress(params.programPk);

    const keys = [
      { pubkey: programDataPk, isSigner: false, isWritable: true },
      { pubkey: params.authorityPk, isSigner: true, isWritable: false },
    ];
    if (params.newAuthorityPk) {
      keys.push({
        pubkey: params.newAuthorityPk,
        isSigner: false,
        isWritable: false,
      });
    }

    return new PgWeb3.TransactionInstruction({
      keys,
      programId: this.programId,
      data,
    });
  }

  /**
   * Generate a tx instruction that close a program, a buffer, or an
   * uninitialized account.
   */
  static close(params: CloseParams) {
    const data = this._encodeData(
      {
        discriminator: 5,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
        ]),
      },
      {}
    );

    const keys = [
      { pubkey: params.closePk, isSigner: false, isWritable: true },
      { pubkey: params.recipientPk, isSigner: false, isWritable: true },
    ];
    if (params.authorityPk) {
      keys.push({
        pubkey: params.authorityPk,
        isSigner: true,
        isWritable: false,
      });
    }
    if (params.programPk) {
      keys.push({
        pubkey: params.programPk,
        isSigner: false,
        isWritable: true,
      });
    }

    return new PgWeb3.TransactionInstruction({
      keys,
      programId: this.programId,
      data,
    });
  }

  /** Encode instruction data. */
  private static _encodeData(
    ix: {
      /** Instruction identifier */
      discriminator: number;
      /** Layout to build the data from */
      layout: BufferLayout.Layout<any>;
    },
    /** Instruction arguments */
    fields: Record<string, any>
  ) {
    const allocLen =
      ix.layout.span >= 0
        ? ix.layout.span
        : (ix.layout as unknown as { fields: any[] }).fields.reduce(
            (acc, cur) => {
              if (cur.span >= 0) {
                acc += cur.span;
              } else if (typeof cur.alloc === "function") {
                acc += cur.alloc(fields[cur.property]);
              }

              return acc;
            },
            0
          );
    const data = Buffer.alloc(allocLen);
    const layoutFields = Object.assign(
      { discriminator: ix.discriminator },
      fields
    );
    ix.layout.encode(layoutFields, data);
    return data;
  }
}

/** BpfLoaderUpgradeable program interface */
export class BpfLoaderUpgradeable {
  /** Buffer account size without data */
  static BUFFER_HEADER_SIZE = 37; // Option<Pk>

  /** Program account size */
  static BUFFER_PROGRAM_SIZE = 36; // Pk

  /** Get buffer account size. */
  static getBufferAccountSize(programLen: number) {
    return this.BUFFER_HEADER_SIZE + programLen;
  }

  /** Create and initialize a buffer account. */
  static async createBuffer(
    buffer: PgWeb3.Signer,
    lamports: number,
    programLen: number,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new PgWeb3.Transaction()
      .add(
        PgWeb3.SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: buffer.publicKey,
          lamports,
          space: this.getBufferAccountSize(programLen),
          programId: BpfLoaderUpgradeableProgram.programId,
        })
      )
      .add(
        BpfLoaderUpgradeableProgram.initializeBuffer({
          bufferPk: buffer.publicKey,
          authorityPk: wallet.publicKey,
        })
      );

    return await PgTx.send(tx, { keypairSigners: [buffer], wallet });
  }

  /** Update the buffer authority. */
  static async setBufferAuthority(
    bufferPk: PgWeb3.PublicKey,
    newAuthorityPk: PgWeb3.PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new PgWeb3.Transaction().add(
      BpfLoaderUpgradeableProgram.setBufferAuthority({
        bufferPk,
        authorityPk: wallet.publicKey,
        newAuthorityPk,
      })
    );

    return await PgTx.send(tx, { wallet });
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
    } & ConnectionOption &
      WalletOption
  ) {
    const { connection, wallet } = this._getOptions(opts);
    const { loadConcurrency } = PgCommon.setDefault(opts, {
      loadConcurrency: 8,
    });

    // Maximal chunk of the data per tx
    const WRITE_CHUNK_SIZE =
      PgWeb3.PACKET_DATA_SIZE - // Maximum transaction size
      220 - // Data with 1 signature
      44; // Priority fee instruction size

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

            const tx = new PgWeb3.Transaction().add(
              BpfLoaderUpgradeableProgram.write({
                offset,
                bytes,
                bufferPk,
                authorityPk: wallet.publicKey,
              })
            );

            try {
              await PgTx.send(tx, { connection, wallet });
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
        const acc = await connection.getAccountInfo(bufferPk);
        if (!acc) throw new Error();
        return acc;
      }, 2000);

      const onChainProgramData = bufferAccount.data.slice(
        BpfLoaderUpgradeable.BUFFER_HEADER_SIZE,
        BpfLoaderUpgradeable.BUFFER_HEADER_SIZE + programData.length
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
        .filter((i) => i !== null) as number[];
      await loadBuffer(missingIndices, isMissing);
      isMissing = true;
    }
  }

  /** Close the buffer account and withdraw funds. */
  static async closeBuffer(bufferPk: PgWeb3.PublicKey, opts?: WalletOption) {
    const { wallet } = this._getOptions(opts);

    const tx = new PgWeb3.Transaction().add(
      BpfLoaderUpgradeableProgram.close({
        closePk: bufferPk,
        recipientPk: wallet.publicKey,
        authorityPk: wallet.publicKey,
      })
    );

    return await PgTx.send(tx, { wallet });
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

    const tx = new PgWeb3.Transaction()
      .add(
        PgWeb3.SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: program.publicKey,
          lamports: programLamports,
          space: this.BUFFER_PROGRAM_SIZE,
          programId: BpfLoaderUpgradeableProgram.programId,
        })
      )
      .add(
        BpfLoaderUpgradeableProgram.deployWithMaxProgramLen({
          programPk: program.publicKey,
          bufferPk,
          upgradeAuthorityPk: wallet.publicKey,
          payerPk: wallet.publicKey,
          maxDataLen,
        })
      );

    return await PgTx.send(tx, { wallet, keypairSigners: [program] });
  }

  /** Update the program authority. */
  static async setProgramAuthority(
    programPk: PgWeb3.PublicKey,
    newAuthorityPk?: PgWeb3.PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new PgWeb3.Transaction().add(
      BpfLoaderUpgradeableProgram.setUpgradeAuthority({
        programPk,
        authorityPk: wallet.publicKey,
        newAuthorityPk,
      })
    );

    return await PgTx.send(tx, { wallet });
  }

  /** Upgrade a program. */
  static async upgradeProgram(
    programPk: PgWeb3.PublicKey,
    bufferPk: PgWeb3.PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new PgWeb3.Transaction().add(
      BpfLoaderUpgradeableProgram.upgrade({
        programPk,
        bufferPk,
        authorityPk: wallet.publicKey,
        spillPk: wallet.publicKey,
      })
    );

    return await PgTx.send(tx, { wallet });
  }

  /** Close the program account and withdraw funds. */
  static async closeProgram(programPk: PgWeb3.PublicKey, opts?: WalletOption) {
    const { wallet } = this._getOptions(opts);

    const tx = new PgWeb3.Transaction().add(
      BpfLoaderUpgradeableProgram.close({
        closePk: BpfLoaderUpgradeableProgram.getProgramDataAddress(programPk),
        recipientPk: wallet.publicKey,
        authorityPk: wallet.publicKey,
        programPk,
      })
    );

    return await PgTx.send(tx, { wallet });
  }

  /** Get the connection and wallet instance. */
  private static _getOptions(opts?: ConnectionOption & WalletOption) {
    const connection = opts?.connection ?? PgConnection.current;

    const wallet = opts?.wallet ?? PgWallet.current;
    if (!wallet) throw new Error("Wallet is not connected");

    return { connection, wallet };
  }
}
