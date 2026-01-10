import { declareDecorator, updatable } from "./decorators";

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

export const PgGlobal = declareDecorator(_PgGlobal, {
  updatable: { defaultState },
});
