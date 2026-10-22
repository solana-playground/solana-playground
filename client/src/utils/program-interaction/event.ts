import { PgCommon } from "../common";
import { getAnchorProgram } from "./program";
import type { IdlEvents, LatestIdl } from "./idl-types";
import type { KeyOf, OrString } from "../types";

/**
 * Add a program event listener that listens to on-chain events.
 *
 * @param eventName program event name
 * @param cb callback to run once the event fires
 * @returns an async disposable
 */
export const addEventListener = <E extends KeyOf<IdlEvents<LatestIdl>>>(
  eventName: E,
  cb: (
    event: OrString<IdlEvents<LatestIdl>[E]>,
    slot: number,
    signature: string
  ) => void
) => {
  const program = getAnchorProgram();
  const camelName = PgCommon.toCamelCase(eventName);
  const id = program.addEventListener(camelName, cb);
  return { dispose: () => program.removeEventListener(id) };
};
