import { EditorView, ViewUpdate } from "@codemirror/view";

import { PgExplorer, FullFile } from "../../../../../../utils/pg";

export const autosave = (
  explorer: PgExplorer,
  curFile: FullFile,
  ms: number
) => {
  let timeoutId: NodeJS.Timeout;

  return EditorView.updateListener.of((v: ViewUpdate) => {
    if (v.docChanged) {
      const args: [string, string] = [curFile.path, v.state.doc.toString()];
      explorer.saveFileToState(...args);
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        explorer
          .saveFileToIndexedDB(...args)
          .catch((e: any) =>
            console.log(`Error saving file ${curFile.path}. ${e.message}`)
          );
      }, ms);
    }
  });
};
