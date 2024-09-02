// Thanks to @fanatid

import { Buffer } from "buffer";
import * as BufferLayout from "@solana/buffer-layout";
import {
  PACKET_DATA_SIZE,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Signer,
} from "@solana/web3.js";

import { encodeData, InstructionType } from "./instruction";
import * as Layout from "./layout";
import {
  ConnectionOption,
  PgCommon,
  PgConnection,
  PgTx,
  PgWallet,
  WalletOption,
} from "../pg";

const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

/** An enumeration of valid BpfUpgradeableLoaderInstructionType's */
type BpfUpgradeableLoaderInstructionType =
  | "InitializeBuffer"
  | "Write"
  | "DeployWithMaxDataLen"
  | "Upgrade"
  | "SetAuthority"
  | "Close";

/**
 * An enumeration of valid system InstructionType's
 * @internal
 */
const BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS: {
  [type in BpfUpgradeableLoaderInstructionType]: InstructionType;
} = Object.freeze({
  InitializeBuffer: {
    index: 0,
    layout: BufferLayout.struct<BufferLayout.UInt>([
      BufferLayout.u32("instruction"),
    ]),
  },
  Write: {
    index: 1,
    layout: BufferLayout.struct<BufferLayout.UInt>([
      BufferLayout.u32("instruction"),
      BufferLayout.u32("offset"),
      Layout.rustVecBytes("bytes"),
    ]),
  },
  DeployWithMaxDataLen: {
    index: 2,
    layout: BufferLayout.struct<BufferLayout.UInt>([
      BufferLayout.u32("instruction"),
      BufferLayout.u32("maxDataLen"),
      BufferLayout.u32("maxDataLenPadding"),
    ]),
  },
  Upgrade: {
    index: 3,
    layout: BufferLayout.struct<BufferLayout.UInt>([
      BufferLayout.u32("instruction"),
    ]),
  },
  SetAuthority: {
    index: 4,
    layout: BufferLayout.struct<BufferLayout.UInt>([
      BufferLayout.u32("instruction"),
    ]),
  },
  Close: {
    index: 5,
    layout: BufferLayout.struct<BufferLayout.UInt>([
      BufferLayout.u32("instruction"),
    ]),
  },
});

/** Initialize buffer tx params */
type InitializeBufferParams = {
  /** Public key of the buffer account */
  bufferPk: PublicKey;
  /** Public key to set as authority of the initialized buffer */
  authorityPk: PublicKey;
};

/** Write tx params */
type WriteParams = {
  /** Offset at which to write the given bytes. */
  offset: number;
  /** Chunk of program data */
  bytes: Buffer;
  /** Public key of the buffer account */
  bufferPk: PublicKey;
  /** Public key to set as authority of the initialized buffer */
  authorityPk: PublicKey;
};

/** Deploy program tx params */
type DeployWithMaxProgramLenParams = {
  /** Maximum length that the program can be upgraded to. */
  maxDataLen: number;
  /** The uninitialized Program account */
  programPk: PublicKey;
  /** The buffer account where the program data has been written. The buffer account’s authority must match the program’s authority */
  bufferPk: PublicKey;
  /** The program’s authority */
  upgradeAuthorityPk: PublicKey;
  /** The payer account that will pay to create the ProgramData account */
  payerPk: PublicKey;
};

/** Upgrade tx params */
type UpgradeParams = {
  /** The program account */
  programPk: PublicKey;
  /** The buffer account where the program data has been written. The buffer account’s authority must match the program’s authority */
  bufferPk: PublicKey;
  /** The spill account */
  spillPk: PublicKey;
  /** The program’s authority */
  authorityPk: PublicKey;
};

/** Update buffer authority tx params */
type SetBufferAuthorityParams = {
  /** The buffer account where the program data has been written */
  bufferPk: PublicKey;
  /** The buffer's authority */
  authorityPk: PublicKey;
  /** New buffer's authority */
  newAuthorityPk: PublicKey;
};

/** Update program authority tx params */
type SetUpgradeAuthorityParams = {
  /** The program account */
  programPk: PublicKey;
  /** The current authority */
  authorityPk: PublicKey;
  /** The new authority, optional, if omitted then the program will not be upgradable */
  newAuthorityPk: PublicKey | undefined;
};

/** Close account tx params */
type CloseParams = {
  /** The account to close */
  closePk: PublicKey;
  /** The account to deposit the closed account’s lamports */
  recipientPk: PublicKey;
  /** The account’s authority, Optional, required for initialized accounts */
  authorityPk: PublicKey | undefined;
  /** The associated Program account if the account to close is a ProgramData account */
  programPk: PublicKey | undefined;
};

/**
 * Factory class for txs to interact with the BpfLoaderUpgradeable program
 */
class BpfLoaderUpgradeableProgram {
  /** Public key that identifies the BpfLoaderUpgradeable program */
  static programId = BPF_LOADER_UPGRADEABLE_PROGRAM_ID;

  /** Derive programData address from program. */
  static async getProgramDataAddress(programPk: PublicKey): Promise<PublicKey> {
    return (
      await PublicKey.findProgramAddress([programPk.toBuffer()], this.programId)
    )[0];
  }

  /** Generate a tx instruction that initialize buffer account. */
  static initializeBuffer(
    params: InitializeBufferParams
  ): TransactionInstruction {
    const type = BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS.InitializeBuffer;
    const data = encodeData(type, {});

    return new TransactionInstruction({
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
  static write(params: WriteParams): TransactionInstruction {
    const type = BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS.Write;
    const data = encodeData(type, {
      offset: params.offset,
      bytes: params.bytes,
    });

    return new TransactionInstruction({
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
  static async deployWithMaxProgramLen(
    params: DeployWithMaxProgramLenParams
  ): Promise<TransactionInstruction> {
    const type =
      BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS.DeployWithMaxDataLen;
    const data = encodeData(type, {
      maxDataLen: params.maxDataLen,
      maxDataLenPadding: 0,
    });

    const programDataPk = await this.getProgramDataAddress(params.programPk);

    return new TransactionInstruction({
      keys: [
        { pubkey: params.payerPk, isSigner: true, isWritable: true },
        { pubkey: programDataPk, isSigner: false, isWritable: true },
        { pubkey: params.programPk, isSigner: false, isWritable: true },
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
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
  static async upgrade(params: UpgradeParams): Promise<TransactionInstruction> {
    const type = BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS.Upgrade;
    const data = encodeData(type, {});

    const programDataPk = await this.getProgramDataAddress(params.programPk);

    return new TransactionInstruction({
      keys: [
        { pubkey: programDataPk, isSigner: false, isWritable: true },
        { pubkey: params.programPk, isSigner: false, isWritable: true },
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        { pubkey: params.spillPk, isSigner: true, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        {
          pubkey: params.authorityPk,
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: this.programId,
      data,
    });
  }

  /** Generate a tx instruction that set a new buffer authority. */
  static setBufferAuthority(
    params: SetBufferAuthorityParams
  ): TransactionInstruction {
    const type = BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS.SetAuthority;
    const data = encodeData(type, {});

    return new TransactionInstruction({
      keys: [
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        {
          pubkey: params.authorityPk,
          isSigner: true,
          isWritable: false,
        },
        {
          pubkey: params.newAuthorityPk,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programId,
      data,
    });
  }

  /** Generate a tx instruction that set a new program authority. */
  static async setUpgradeAuthority(
    params: SetUpgradeAuthorityParams
  ): Promise<TransactionInstruction> {
    const type = BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS.SetAuthority;
    const data = encodeData(type, {});

    const programDataPk = await this.getProgramDataAddress(params.programPk);

    const keys = [
      { pubkey: programDataPk, isSigner: false, isWritable: true },
      {
        pubkey: params.authorityPk,
        isSigner: true,
        isWritable: false,
      },
    ];

    if (params.newAuthorityPk) {
      keys.push({
        pubkey: params.newAuthorityPk,
        isSigner: false,
        isWritable: false,
      });
    }

    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data,
    });
  }

  /**
   * Generate a tx instruction that close a program, a buffer, or an
   * uninitialized account.
   */
  static close(params: CloseParams): TransactionInstruction {
    const type = BPF_UPGRADEABLE_LOADER_INSTRUCTION_LAYOUTS.Close;
    const data = encodeData(type, {});

    const keys = [
      { pubkey: params.closePk, isSigner: false, isWritable: true },
      {
        pubkey: params.recipientPk,
        isSigner: false,
        isWritable: true,
      },
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

    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data,
    });
  }
}

/** BpfLoaderUpgradeable program interface */
export class BpfLoaderUpgradeable {
  /** Buffer account size without data */
  static BUFFER_HEADER_SIZE: number = 37; // Option<Pk>

  /** Program account size */
  static BUFFER_PROGRAM_SIZE: number = 36; // Pk

  /** ProgramData account size without data */
  static BUFFER_PROGRAM_DATA_HEADER_SIZE: number = 45; // usize + Option<Pk>

  /** Maximal chunk of the data per tx */
  static WRITE_CHUNK_SIZE: number =
    PACKET_DATA_SIZE - // Maximum transaction size
    220 - // Data with 1 signature
    44; // Priority fee instruction size

  /** Get buffer account size. */
  static getBufferAccountSize(programLen: number) {
    return this.BUFFER_HEADER_SIZE + programLen;
  }

  /** Create and initialize a buffer account. */
  static async createBuffer(
    buffer: Signer,
    lamports: number,
    programLen: number,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: buffer.publicKey,
        lamports,
        space: this.getBufferAccountSize(programLen),
        programId: BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
      })
    );
    tx.add(
      BpfLoaderUpgradeableProgram.initializeBuffer({
        bufferPk: buffer.publicKey,
        authorityPk: wallet.publicKey,
      })
    );

    return await PgTx.send(tx, {
      keypairSigners: [buffer],
      wallet,
    });
  }

  /** Update the buffer authority. */
  static async setBufferAuthority(
    bufferPk: PublicKey,
    newAuthorityPk: PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new Transaction();
    tx.add(
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
    bufferPk: PublicKey,
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

    const loadBuffer = async (indices: number[], isMissing?: boolean) => {
      if (isMissing) opts?.onMissing?.(indices.length);

      let i = 0;
      await Promise.all(
        new Array(loadConcurrency).fill(null).map(async () => {
          while (1) {
            if (opts?.abortController?.signal.aborted) return;

            const offset = indices[i] * BpfLoaderUpgradeable.WRITE_CHUNK_SIZE;
            i++;
            const endOffset = offset + BpfLoaderUpgradeable.WRITE_CHUNK_SIZE;
            const bytes = programData.slice(offset, endOffset);
            if (bytes.length === 0) break;

            const tx = new Transaction();
            tx.add(
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

    const txCount = Math.ceil(
      programData.length / BpfLoaderUpgradeable.WRITE_CHUNK_SIZE
    );
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
          const start = i * BpfLoaderUpgradeable.WRITE_CHUNK_SIZE;
          const end = start + BpfLoaderUpgradeable.WRITE_CHUNK_SIZE;
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
  static async closeBuffer(bufferPk: PublicKey, opts?: WalletOption) {
    const { wallet } = this._getOptions(opts);

    const tx = new Transaction();
    tx.add(
      BpfLoaderUpgradeableProgram.close({
        closePk: bufferPk,
        recipientPk: wallet.publicKey,
        authorityPk: wallet.publicKey,
        programPk: undefined,
      })
    );

    return await PgTx.send(tx, { wallet });
  }

  /** Create a program account from initialized buffer. */
  static async deployProgram(
    program: Signer,
    bufferPk: PublicKey,
    programLamports: number,
    maxDataLen: number,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: program.publicKey,
        lamports: programLamports,
        space: this.BUFFER_PROGRAM_SIZE,
        programId: BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
      })
    );
    tx.add(
      await BpfLoaderUpgradeableProgram.deployWithMaxProgramLen({
        programPk: program.publicKey,
        bufferPk,
        upgradeAuthorityPk: wallet.publicKey,
        payerPk: wallet.publicKey,
        maxDataLen,
      })
    );

    return await PgTx.send(tx, {
      wallet,
      keypairSigners: [program],
    });
  }

  /** Update the program authority. */
  static async setProgramAuthority(
    programPk: PublicKey,
    newAuthorityPk: PublicKey | undefined,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new Transaction();
    tx.add(
      await BpfLoaderUpgradeableProgram.setUpgradeAuthority({
        programPk,
        authorityPk: wallet.publicKey,
        newAuthorityPk,
      })
    );

    return await PgTx.send(tx, { wallet });
  }

  /** Upgrade a program. */
  static async upgradeProgram(
    programPk: PublicKey,
    bufferPk: PublicKey,
    opts?: WalletOption
  ) {
    const { wallet } = this._getOptions(opts);

    const tx = new Transaction();
    tx.add(
      await BpfLoaderUpgradeableProgram.upgrade({
        programPk,
        bufferPk,
        authorityPk: wallet.publicKey,
        spillPk: wallet.publicKey,
      })
    );

    return await PgTx.send(tx, { wallet });
  }

  /** Close the program account and withdraw funds. */
  static async closeProgram(programPk: PublicKey, opts?: WalletOption) {
    const { wallet } = this._getOptions(opts);

    const tx = new Transaction();
    tx.add(
      BpfLoaderUpgradeableProgram.close({
        closePk: await BpfLoaderUpgradeableProgram.getProgramDataAddress(
          programPk
        ),
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
