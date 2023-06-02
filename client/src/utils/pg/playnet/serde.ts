import { Message, Transaction } from "@solana/web3.js";
import { utils } from "@project-serum/anchor";

/** `Buffer` encoding */
type Encoding = "base58" | "base64";

export class PgSerde {
  /**
   * Serialize the base64 transaction string to make it compatible for Serde
   * to deserialize it from WASM.
   *
   * @param txBase64 base64 encoded transaction string
   * @returns Rust Serde serialized transaction string
   */
  static serializeTx(txBase64: string) {
    // Decode base64 tx and get tx object
    const txBuffer = this.toBuffer(txBase64, "base64");
    const tx = Transaction.from(txBuffer);

    // Convert tx object into Rust Serde format
    const rustTx = this._convertTx(tx);

    // Serialize Rust tx object
    return this._serializeObject(rustTx);
  }

  /**
   * Serialize the base64 message string to make it compatible for Serde to
   * deserialize it from WASM.
   *
   * @param msgBase64 base64 encoded message string
   * @returns Rust Serde serialized message string
   */
  static serializeMsg(msgBase64: string) {
    // Decode base64 msg and get msg object
    const msgBuffer = this.toBuffer(msgBase64, "base64");
    const msg = Message.from(msgBuffer);

    // Convert msg object into Rust Serde format
    const rustMsg = this._convertMsg(msg);

    // Serialize Rust msg object
    return this._serializeObject(rustMsg);
  }

  /** Convert to `string` from `Buffer`. */
  static fromBuffer(buffer: Buffer, encoding: Encoding) {
    switch (encoding) {
      case "base58":
        return utils.bytes.bs58.encode(buffer);
      case "base64":
        return utils.bytes.base64.encode(buffer);
    }
  }

  /** Convert to `Buffer` from `string`. */
  static toBuffer(str: string, encoding: Encoding) {
    switch (encoding) {
      case "base58":
        return utils.bytes.bs58.decode(str);
      case "base64":
        return utils.bytes.base64.decode(str);
    }
  }

  /** Serialize the given object to bytes. */
  private static _serializeObject(obj: Object) {
    return Uint8Array.from(Buffer.from(JSON.stringify(obj)));
  }

  /** Convert the given transaction to a `serde` compatible transaction. */
  private static _convertTx(tx: Transaction) {
    return {
      signatures: this._convertToSerdeArray(
        tx.signatures
          .filter((item) => item.signature !== null)
          .map((item) => Array.from(item.signature!))
      ),
      message: this._convertMsg(tx.compileMessage()),
    };
  }

  /** Convert the given message to a `serde` compatible message. */
  private static _convertMsg(msg: Message) {
    return {
      header: msg.header,
      accountKeys: this._convertToSerdeArray(
        msg.accountKeys.map((key) => Array.from(key.toBytes()))
      ),
      recentBlockhash: Array.from(this.toBuffer(msg.recentBlockhash, "base58")),
      instructions: this._convertToSerdeArray(
        msg.instructions.map((ix) => ({
          ...ix,
          accounts: this._convertToSerdeArray(ix.accounts),
          data: this._convertToSerdeArray(
            Array.from(this.toBuffer(ix.data, "base58"))
          ),
        }))
      ),
    };
  }

  /** Converts the array according to `short_vec` length serialization. */
  private static _convertToSerdeArray<T>(arr: T[]): [number[], ...T[]] {
    return [
      arr.length < 0x80
        ? [arr.length]
        : [0x80 + (arr.length % 0x80), Math.floor(arr.length / 0x80)],
      ...arr,
    ];
  }
}
