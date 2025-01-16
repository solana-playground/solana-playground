import { declareUpdatable, updatable } from "./decorators";

interface GlobalState {
  buildLoading: boolean;
  deployState: "ready" | "loading" | "paused" | "cancelled";
}

const defaultState: GlobalState = {
  buildLoading: false,
  deployState: "ready",
};

@updatable({ defaultState })
class _PgGlobal {}

export const PgGlobal = declareUpdatable(_PgGlobal, { defaultState });
