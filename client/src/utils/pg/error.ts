import { PROGRAM_ERROR } from "../../constants";

export class PgError {
  static convertErrorMessage(msg: string) {
    for (const programErrorCode in PROGRAM_ERROR) {
      if (msg.endsWith(programErrorCode)) {
        msg = msg.replace(
          `custom program error: 0x${programErrorCode}`,
          PROGRAM_ERROR[programErrorCode]
        );
        break;
      }
    }

    return msg;
  }
}
