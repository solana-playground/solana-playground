import { EditorView, ViewUpdate } from "@codemirror/view";

import { PgExplorer, FullFile } from "../../../../../../utils/pg/explorer";

export const autosave = (
  explorer: PgExplorer,
  curFile: FullFile,
  ms: number
) => {
  let timeoutId: NodeJS.Timeout;

  return EditorView.updateListener.of((v: ViewUpdate) => {
    if (v.docChanged) {
      explorer.saveFile(curFile.path, v.state.doc.toString());
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        explorer.saveLs();
      }, ms);
    }
  });
};
