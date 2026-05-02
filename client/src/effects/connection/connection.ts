import {
  PgCommon,
  PgConnection,
  PgView,
  PgWallet,
  SyncOrAsync,
} from "../../utils";

export const connection = () => {
  return PgCommon.batchChanges(async () => {
    if (Object.values(cache).every((v) => v)) return;
    if (!PgWallet.current) return;
    if (PgConnection.cluster === "playnet") return;
    if (PgConnection.isConnected && !PgConnection.isClusterDown) return;

    // Connection failed or the cluster is down
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
