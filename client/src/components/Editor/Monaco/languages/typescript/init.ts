import {
  Disposable,
  PgCommon,
  PgExplorer,
  PgJsPackage,
  PgSettings,
} from "../../../../../utils";
import { initDeclarations } from "./declarations";

export const init = async () => {
  let disposable: Disposable | undefined;
  return await PgCommon.executeInitial(
    (cb) => {
      return PgCommon.batchChanges(cb, [
        PgJsPackage.onDidUpdate,
        PgExplorer.onDidInit,
        // TODO: Remove this (`onDidInit` should cover `onDidSwitchWorkspace`)
        PgExplorer.onDidSwitchWorkspace,
        // TODO: Remove
        PgSettings.onDidChangeExperimentalUnstable,
      ]);
    },
    async () => {
      disposable?.dispose();
      disposable = await initDeclarations();
    }
  );
};
