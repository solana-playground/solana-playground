import { Message, Transaction } from "@solana/web3.js";
import { utils } from "@project-serum/anchor";

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
    const txBuffer = PgDeserializer.fromBase64Str(txBase64);
    const tx = Transaction.from(txBuffer);

    // Convert tx object into Rust Serde format
    const rustTx = PgSerializer.convertTx(tx);

    // Serialize Rust tx object
    return PgSerializer.toRustBytes(rustTx);
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
    const msgBuffer = PgDeserializer.fromBase64Str(msgBase64);
    const msg = Message.from(msgBuffer);

    // Convert msg object into Rust Serde format
    const rustMsg = PgSerializer.convertMsg(msg);

    // Serialize Rust msg object
    return PgSerializer.toRustBytes(rustMsg);
  }
}

class PgSerializer {
  static toRustBytes(obj: Object) {
    return Uint8Array.from(Buffer.from(JSON.stringify(obj)));
  }

  static convertTx(tx: Transaction) {
    const msg = tx.compileMessage();
    return {
      signatures: this._convertToSerdeArray(
        tx.signatures
          .filter((item) => item.signature !== null)
          .map((item) => Array.from(item.signature!))
      ),
      message: this.convertMsg(msg),
    };
  }

  static convertMsg(msg: Message) {
    return {
      header: msg.header,
      accountKeys: this._convertToSerdeArray(
        msg.accountKeys.map((key) => Array.from(key.toBytes()))
      ),
      recentBlockhash: Array.from(utils.bytes.bs58.decode(msg.recentBlockhash)),
      instructions: this._convertToSerdeArray(
        msg.instructions.map((ix) => ({
          ...ix,
          accounts: this._convertToSerdeArray(ix.accounts),
          data: this._convertToSerdeArray(
            Array.from(utils.bytes.bs58.decode(ix.data))
          ),
        }))
      ),
    };
  }

  /**
   * Converts the array according to `short_vec` length serialization
   *
   * @param arr Array to convert
   * @returns the Serde serialize ready array
   */
  private static _convertToSerdeArray(arr: any[]) {
    return [
      arr.length < 0x80
        ? [arr.length]
        : [0x80 + (arr.length % 0x80), Math.floor(arr.length / 0x80)],
      ...arr,
    ];
  }
}

class PgDeserializer {
  /**
   * Decode base64 string
   *
   * @param base64 Base64 string
   * @returns the decoded `Buffer`
   */
  static fromBase64Str(base64: string) {
    return utils.bytes.base64.decode(base64);
  }
}
