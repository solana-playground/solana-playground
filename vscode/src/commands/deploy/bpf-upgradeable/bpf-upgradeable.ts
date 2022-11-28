import * as vscode from "vscode";

import * as BufferLayout from "@solana/buffer-layout";
import {
  PACKET_DATA_SIZE,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Connection,
  Signer,
  Keypair,
} from "@solana/web3.js";

import { encodeData, InstructionType } from "./instruction";
import * as Layout from "./layout";
import { PgCommon, PgTx } from "../../../utils";

const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

/**
 * An enumeration of valid BpfUpgradeableLoaderInstructionType's
 */
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

/**
 * Initialize buffer tx params
 */
type InitializeBufferParams = {
  /** Public key of the buffer account */
  bufferPk: PublicKey;
  /** Public key to set as authority of the initialized buffer */
  authorityPk: PublicKey;
};

/**
 * Write tx params
 */
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

/**
 * Deploy a program tx params
 */
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

/**
 * Upgrade tx params
 */
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

/**
 * Update buffer authority tx params
 */
type SetBufferAuthorityParams = {
  /** The buffer account where the program data has been written */
  bufferPk: PublicKey;
  /** The buffer's authority */
  authorityPk: PublicKey;
  /** New buffer's authority */
  newAuthorityPk: PublicKey;
};

/**
 * Update program authority tx params
 */
type SetUpgradeAuthorityParams = {
  /** The program account */
  programPk: PublicKey;
  /** The current authority */
  authorityPk: PublicKey;
  /** The new authority, optional, if omitted then the program will not be upgradeable */
  newAuthorityPk: PublicKey | undefined;
};

/**
 * Close account tx params
 */
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
  /**
   * Public key that identifies the BpfLoaderUpgradeable program
   */
  static programId: PublicKey = BPF_LOADER_UPGRADEABLE_PROGRAM_ID;

  /**
   * Derive programData address from program
   */
  static async getProgramDataAddress(programPk: PublicKey): Promise<PublicKey> {
    return (
      await PublicKey.findProgramAddress([programPk.toBuffer()], this.programId)
    )[0];
  }

  /**
   * Generate a tx instruction that initialize buffer account
   */
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
   * Generate a tx instruction that write a chunk of program data
   *   to a buffer account
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
   * Generate a tx instruction that deploy a program with a specified
   *   maximum program length
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

  /**
   * Generate a tx instruction that upgrade a program
   */
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

  /**
   * Generate a tx instruction that set a new buffer authority
   */
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

  /**
   * Generate a tx instruction that set a new program authority
   */
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
   * Generate a tx instruction that close program, buffer, or
   *   uninitialized account
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

/**
 * BpfLoaderUpgradeable program interface
 */
export class BpfLoaderUpgradeable {
  /**
   * Buffer account size without data
   */
  static BUFFER_HEADER_SIZE: number = 37; // Option<Pk>

  /**
   * Program account size
   */
  static BUFFER_PROGRAM_SIZE: number = 36; // Pk

  /**
   * ProgramData account size without data
   */
  static BUFFER_PROGRAM_DATA_HEADER_SIZE: number = 45; // usize + Option<Pk>

  /**
   * Maximal chunk of the data per tx
   */
  static WRITE_CHUNK_SIZE: number = PACKET_DATA_SIZE - 220; // Data with 1 signature

  /**
   * Get buffer account size
   */
  static getBufferAccountSize(programLen: number): number {
    return this.BUFFER_HEADER_SIZE + programLen;
  }

  /**
   * Create and initialize buffer account
   */
  static async createBuffer(
    conn: Connection,
    walletKp: Keypair,
    buffer: Signer,
    lamports: number,
    programLen: number
  ) {
    const tx: Transaction = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: walletKp.publicKey,
        newAccountPubkey: buffer.publicKey,
        lamports,
        space: this.getBufferAccountSize(programLen),
        programId: BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
      })
    );
    tx.add(
      BpfLoaderUpgradeableProgram.initializeBuffer({
        bufferPk: buffer.publicKey,
        authorityPk: walletKp.publicKey,
      })
    );

    return await PgTx.send(tx, conn, walletKp, [buffer]);
  }

  /**
   * Update buffer authority
   */
  static async setBufferAuthority(
    conn: Connection,
    walletKp: Keypair,
    bufferPk: PublicKey,
    newAuthorityPk: PublicKey
  ) {
    const tx: Transaction = new Transaction();
    tx.add(
      BpfLoaderUpgradeableProgram.setBufferAuthority({
        bufferPk,
        authorityPk: walletKp.publicKey,
        newAuthorityPk,
      })
    );

    return await PgTx.send(tx, conn, walletKp);
  }

  /**
   * Load programData to initialized buffer account
   */
  static async loadBuffer(
    conn: Connection,
    walletKp: Keypair,
    bufferPk: PublicKey,
    programData: Buffer,
    loadConcurrency: number = 8
  ) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Deploying...",
      },
      async (progress) => {
        let bytesOffset = 0;
        await Promise.all(
          new Array(loadConcurrency).fill(null).map(async () => {
            for (;;) {
              const offset = bytesOffset;
              bytesOffset += BpfLoaderUpgradeable.WRITE_CHUNK_SIZE;

              const bytes = programData.slice(
                offset,
                offset + BpfLoaderUpgradeable.WRITE_CHUNK_SIZE
              );
              if (bytes.length === 0) {
                break;
              }

              const tx: Transaction = new Transaction();
              tx.add(
                BpfLoaderUpgradeableProgram.write({
                  offset,
                  bytes,
                  bufferPk,
                  authorityPk: walletKp.publicKey,
                })
              );

              let sleepAmount = 1000;
              // Retry until writing is successful
              for (;;) {
                try {
                  const writeTxHash = await PgTx.send(tx, conn, walletKp);

                  console.count("buffer write");

                  // Don't confirm on localhost
                  if (!conn.rpcEndpoint.includes("localhost")) {
                    const txResult = await PgTx.confirm(writeTxHash, conn);
                    if (!txResult?.err) break;
                  } else break;
                } catch (e: any) {
                  console.log("Buffer write error:", e.message);

                  await PgCommon.sleep(sleepAmount);
                  // Incrementally sleep incase of being rate-limited
                  if (sleepAmount < 60000) sleepAmount *= 1.5;
                }
              }

              progress.report({
                increment:
                  (BpfLoaderUpgradeable.WRITE_CHUNK_SIZE / programData.length) *
                  100,
              });
            }
          })
        );
      }
    );

    console.countReset("buffer write");
  }

  /**
   * Close buffer account and withdraw funds
   */
  static async closeBuffer(
    conn: Connection,
    walletKp: Keypair,
    bufferPk: PublicKey
  ) {
    const tx: Transaction = new Transaction();
    tx.add(
      BpfLoaderUpgradeableProgram.close({
        closePk: bufferPk,
        recipientPk: walletKp.publicKey,
        authorityPk: walletKp.publicKey,
        programPk: undefined,
      })
    );

    return await PgTx.send(tx, conn, walletKp);
  }

  /**
   * create program account from initialized buffer
   */
  static async deployProgram(
    conn: Connection,
    walletKp: Keypair,
    bufferPk: PublicKey,
    program: Signer,
    programLamports: number,
    maxDataLen: number
  ) {
    const tx: Transaction = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: walletKp.publicKey,
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
        upgradeAuthorityPk: walletKp.publicKey,
        payerPk: walletKp.publicKey,
        maxDataLen,
      })
    );

    return await PgTx.send(tx, conn, walletKp, [program]);
  }

  /**
   * Update program authority
   */
  static async setProgramAuthority(
    programPk: PublicKey,
    conn: Connection,
    walletKp: Keypair,
    newAuthorityPk: PublicKey | undefined
  ) {
    const tx: Transaction = new Transaction();
    tx.add(
      await BpfLoaderUpgradeableProgram.setUpgradeAuthority({
        programPk,
        authorityPk: walletKp.publicKey,
        newAuthorityPk,
      })
    );

    return await PgTx.send(tx, conn, walletKp);
  }

  /**
   * Upgrade a program
   */
  static async upgradeProgram(
    programPk: PublicKey,
    conn: Connection,
    walletKp: Keypair,
    bufferPk: PublicKey,
    spillPk: PublicKey
  ) {
    const tx: Transaction = new Transaction();
    tx.add(
      await BpfLoaderUpgradeableProgram.upgrade({
        programPk,
        bufferPk,
        spillPk,
        authorityPk: walletKp.publicKey,
      })
    );

    return await PgTx.send(tx, conn, walletKp);
  }

  /**
   * Close program account and withdraw funds
   */
  static async closeProgram(
    programPk: PublicKey,
    conn: Connection,
    walletKp: Keypair
  ) {
    const tx: Transaction = new Transaction();
    tx.add(
      BpfLoaderUpgradeableProgram.close({
        closePk: await BpfLoaderUpgradeableProgram.getProgramDataAddress(
          programPk
        ),
        recipientPk: walletKp.publicKey,
        authorityPk: walletKp.publicKey,
        programPk,
      })
    );

    return await PgTx.send(tx, conn, walletKp);
  }
}
