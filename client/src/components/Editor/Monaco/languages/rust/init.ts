import { initRustAnalyzer } from "./rust-analyzer";
import { PgEditor } from "../../../../../utils";

export const init = () =>
  initRustAnalyzer().catch((e) => {
    // Otherwise the last status stays in the bottom bar forever
    PgEditor.setRustAnalyzerStatus(null);
    throw e;
  });
