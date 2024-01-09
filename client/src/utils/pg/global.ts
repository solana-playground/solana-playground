import { declareUpdatable, updatable } from "./decorators";

interface GlobalState {
  buildLoading: boolean;
  deployState: "ready" | "loading" | "paused" | "cancelled";
}

const defaultState: GlobalState = {
  buildLoading: false,
  deployState: "ready",
};

/** Nothing to persist. */
const storage = {
  read() {
    return defaultState;
  },

  write(state: GlobalState) {},
};

@updatable({ defaultState, storage })
class _PgGlobal {}

export const PgGlobal = declareUpdatable(_PgGlobal, { defaultState });
