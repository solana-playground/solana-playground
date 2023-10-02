import { declareUpdatable, updatable } from "./decorators";

interface GlobalState {
  buildLoading: boolean;
  deployLoading: boolean;
}

const defaultState: GlobalState = {
  buildLoading: false,
  deployLoading: false,
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
