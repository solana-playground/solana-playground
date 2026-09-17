// Deep imports keep this module loadable in jest, where the `utils` barrel
// fails on build-time globals
import { PgCommon } from "../../../../../../utils/common";
import type { Disposable } from "../../../../../../utils/types";

/** Connection state of the server-side rust-analyzer session */
export type LspStatus = "off" | "connecting" | "connected" | "disconnected";

/** Status change event name */
const ON_DID_CHANGE_STATUS = "rustanalyzerlspondidchangestatus";

let status: LspStatus = "off";

/** Callback that starts a new session, registered by the backend dispatcher */
let restart: (() => void) | undefined;

/** Set the session status and notify subscribers. */
export const setStatus = (next: LspStatus) => {
  if (next === status) return;
  status = next;
  PgCommon.createAndDispatchCustomEvent(ON_DID_CHANGE_STATUS, status);
};

/** Subscribe to status changes; the callback also runs immediately with the current value. */
export const onDidChangeStatus = (
  cb: (status: LspStatus) => unknown
): Disposable =>
  PgCommon.onDidChange(ON_DID_CHANGE_STATUS, cb, { value: status });

/** Register the callback {@link requestRestart} runs. */
export const setRestartHandler = (cb: () => void) => {
  restart = cb;
};

/** Start a new session over the current one, e.g. after a dropped socket. */
export const requestRestart = () => restart?.();
