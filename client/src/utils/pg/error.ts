import { PROGRAM_ERROR, RPC_ERROR } from "../../constants";

export class PgError {
  static convertErrorMessage(msg: string) {
    let changed = false;

    // Program errors
    for (const programErrorCode in PROGRAM_ERROR) {
      if (msg.endsWith("0x" + programErrorCode)) {
        msg = msg.replace(
          `custom program error: 0x${programErrorCode}`,
          PROGRAM_ERROR[programErrorCode]
        );
        changed = true;
        break;
      }
    }

    // Rpc errors
    if (!changed) {
      for (const rpcError in RPC_ERROR) {
        if (msg.includes(rpcError)) msg = RPC_ERROR[rpcError];
      }
    }

    return msg;
  }
}
