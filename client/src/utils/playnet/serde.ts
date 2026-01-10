import { PgBytes } from "../bytes";
import { PgWeb3 } from "../web3";

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
    const txBuffer = PgBytes.fromBase64(txBase64);
    const tx = PgWeb3.Transaction.from(txBuffer);

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
    const msgBuffer = PgBytes.fromBase64(msgBase64);
    const msg = PgWeb3.Message.from(msgBuffer);

    // Convert msg object into Rust Serde format
    const rustMsg = this._convertMsg(msg);

    // Serialize Rust msg object
    return this._serializeObject(rustMsg);
  }

  /** Serialize the given object to bytes. */
  private static _serializeObject(obj: Object) {
    return Uint8Array.from(Buffer.from(JSON.stringify(obj)));
  }

  /** Convert the given transaction to a `serde` compatible transaction. */
  private static _convertTx(tx: PgWeb3.Transaction) {
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
  private static _convertMsg(msg: PgWeb3.Message) {
    return {
      header: msg.header,
      accountKeys: this._convertToSerdeArray(
        msg.accountKeys.map((key) => Array.from(key.toBytes()))
      ),
      recentBlockhash: Array.from(PgBytes.fromBase58(msg.recentBlockhash)),
      instructions: this._convertToSerdeArray(
        msg.instructions.map((ix) => ({
          ...ix,
          accounts: this._convertToSerdeArray(ix.accounts),
          data: this._convertToSerdeArray(
            Array.from(PgBytes.fromBase58(ix.data))
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
