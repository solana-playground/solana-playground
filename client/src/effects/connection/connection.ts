import {
  PgCommon,
  PgConnection,
  PgView,
  PgWallet,
  SyncOrAsync,
} from "../../utils/pg";

export const connection = () => {
  return PgCommon.batchChanges(async () => {
    if (cache.local && cache.nonLocal) return;
    if (!PgWallet.current) return;
    if (PgConnection.cluster === "playnet") return;

    const RETRY_AMOUNT = 2;
    for (let i = 0; i < RETRY_AMOUNT; i++) {
      const isClusterDown = await PgConnection.getIsClusterDown();
      if (isClusterDown === false) return;

      // Don't sleep on the last iteration
      if (i !== RETRY_AMOUNT - 1) await PgCommon.sleep(5000);
    }

    // Connection failed
    if (PgConnection.cluster === "localnet") {
      executeOnce("local", async () => {
        const { Local } = await import("./Local");
        await PgView.setModal(Local);
      });
    } else {
      executeOnce("nonLocal", async () => {
        const { NonLocal } = await import("./NonLocal");
        PgView.setToast<never>(NonLocal, {
          options: { autoClose: false, closeOnClick: true },
        });
      });
    }
  }, [PgConnection.onDidChange, PgWallet.onDidChangeCurrent]);
};

// Only show each helper once to not be annoying with pop-ups
const cache = {
  local: false,
  nonLocal: false,
};
const executeOnce = async (kind: keyof typeof cache, cb: () => SyncOrAsync) => {
  if (cache[kind]) return;
  cache[kind] = true;

  try {
    await cb();
  } catch {
    cache[kind] = false;
  }
};
