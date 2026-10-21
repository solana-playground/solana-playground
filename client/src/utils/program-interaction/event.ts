import { getAnchorProgram } from "./program";
import type { Idl, IdlEvents } from "./idl-types";
import type { KeyOf } from "../types";

/**
 * Add a program event listener that listens to on-chain events.
 *
 * @param eventName program event name
 * @param cb callback to run once the event fires
 * @returns an async disposable
 */
export const addEventListener = <E extends KeyOf<IdlEvents<Idl>>>(
  eventName: E,
  cb: (event: IdlEvents<Idl>[E], slot: number, signature: string) => void
) => {
  const program = getAnchorProgram();
  const id = program.addEventListener(eventName, cb);
  return { dispose: () => program.removeEventListener(id) };
};
