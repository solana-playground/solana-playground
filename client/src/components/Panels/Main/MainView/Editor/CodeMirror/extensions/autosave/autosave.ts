import { EditorView, ViewUpdate } from "@codemirror/view";

import { PgExplorer, FullFile } from "../../../../../../../../utils/pg";

export const autosave = (
  explorer: PgExplorer,
  curFile: FullFile,
  ms: number
) => {
  let timeoutId: NodeJS.Timeout;

  return EditorView.updateListener.of((v: ViewUpdate) => {
    // Runs when the editor content changes
    if (v.docChanged) {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const args: [string, string] = [curFile.path, v.state.doc.toString()];

        // Save to state
        explorer.saveFileToState(...args);

        // Save to IndexedDb
        explorer
          .saveFileToIndexedDB(...args)
          .catch((e: any) =>
            console.log(`Error saving file ${curFile.path}. ${e.message}`)
          );
      }, ms);
    }
  });
};
