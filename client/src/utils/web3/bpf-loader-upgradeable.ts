// Thanks to @fanatid

import * as BufferLayout from "@solana/buffer-layout";

import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "./web3";

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
  newAuthorityPk?: PublicKey;
};

/** Close account tx params */
type CloseParams = {
  /** The account to close */
  closePk: PublicKey;
  /** The account to deposit the closed account’s lamports */
  recipientPk: PublicKey;
  /** The account’s authority, Optional, required for initialized accounts */
  authorityPk?: PublicKey;
  /** The associated Program account if the account to close is a ProgramData account */
  programPk?: PublicKey;
};

/**
 * Factory class for txs to interact with the BpfLoaderUpgradeable program
 */
export class BpfLoaderUpgradeableProgram {
  /** Public key that identifies the BpfLoaderUpgradeable program */
  static programId = new PublicKey(
    "BPFLoaderUpgradeab1e11111111111111111111111"
  );

  /** Buffer account size without data */
  static BUFFER_ACCOUNT_METADATA_SIZE = 37; // Option<Pk>

  /** Program account size */
  static PROGRAM_ACCOUNT_SIZE = 36; // Pk

  /** Get buffer account size. */
  static getBufferAccountSize(programLen: number) {
    return this.BUFFER_ACCOUNT_METADATA_SIZE + programLen;
  }

  /** Derive the program data address from the given program address. */
  static getProgramDataAddress(programPk: PublicKey) {
    return PublicKey.findProgramAddressSync(
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
  static write(params: WriteParams) {
    const data = this._encodeData(
      {
        discriminator: 1,
        layout: BufferLayout.struct<BufferLayout.UInt>([
          BufferLayout.u32("discriminator"),
          BufferLayout.u32("offset"),
          vecBytes("bytes"),
        ]),
      },
      { offset: params.offset, bytes: params.bytes }
    );

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

    return new TransactionInstruction({
      keys: [
        { pubkey: programDataPk, isSigner: false, isWritable: true },
        { pubkey: params.programPk, isSigner: false, isWritable: true },
        { pubkey: params.bufferPk, isSigner: false, isWritable: true },
        { pubkey: params.spillPk, isSigner: true, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
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

    return new TransactionInstruction({
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

    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data,
    });
  }

  /**
   * Check whether the given instruction data is a
   * {@link BpfLoaderUpgradeableProgram.initializeBuffer} instruction.
   */
  static isInitializeBufferInstruction(data: Buffer) {
    return data[0] === 0;
  }

  /**
   * Check whether the given instruction data is a
   * {@link BpfLoaderUpgradeableProgram.write} instruction.
   */
  static isWriteInstruction(data: Buffer) {
    return data[0] === 1;
  }

  /**
   * Check whether the given instruction data is a
   * {@link BpfLoaderUpgradeableProgram.deployWithMaxProgramLen} instruction.
   */
  static isDeployWithMaxProgramLenInstruction(data: Buffer) {
    return data[0] === 2;
  }

  /**
   * Check whether the given instruction data is a
   * {@link BpfLoaderUpgradeableProgram.upgrade} instruction.
   */
  static isUpgradeInstruction(data: Buffer) {
    return data[0] === 3;
  }

  /**
   * Check whether the given instruction data is a
   * {@link BpfLoaderUpgradeableProgram.setBufferAuthority} instruction.
   */
  static isSetBufferAuthorityInstruction(data: Buffer) {
    return data[0] === 4;
  }

  /**
   * Check whether the given instruction data is a
   * {@link BpfLoaderUpgradeableProgram.close} instruction.
   */
  static isCloseInstruction(data: Buffer) {
    return data[0] === 5;
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

/** Get the layout for a Rust `Vec<u8>` type (default `bincode`). */
const vecBytes = (property: string) => {
  const len = BufferLayout.nu64("length");
  const dataProp = "bytes";
  const layout = BufferLayout.struct<any>(
    [
      len,
      BufferLayout.blob(
        BufferLayout.offset(
          // Use `u32` here rather than `len` because `blob` doesn't work with
          // big numbers (`nu64`)
          BufferLayout.u32(),
          -len.span
        ),
        dataProp
      ),
    ],
    property
  );
  const _decode = layout.decode.bind(layout);
  const _encode = layout.encode.bind(layout);

  layout.decode = (...args) => _decode(...args)[dataProp];
  layout.encode = (src, ...rest) => _encode({ [dataProp]: src }, ...rest);
  (layout as any).alloc = (b: Buffer) => len.span + b.length;

  return layout;
};
