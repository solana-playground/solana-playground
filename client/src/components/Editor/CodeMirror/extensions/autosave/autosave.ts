import { EditorView, ViewUpdate } from "@codemirror/view";

import { PgExplorer, FullFile } from "../../../../../utils/pg";

export const autosave = (curFile: FullFile, ms: number) => {
  let timeoutId: NodeJS.Timeout;

  return EditorView.updateListener.of((v: ViewUpdate) => {
    // Runs when the editor content changes
    if (v.docChanged) {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const args: [string, string] = [curFile.path, v.state.doc.toString()];

        // Save to state
        PgExplorer.saveFileToState(...args);

        // Saving to state is enough if it's a temporary project
        if (PgExplorer.isTemporary) return;

        // Save to `indexedDB`
        try {
          await PgExplorer.fs.writeFile(...args);
        } catch (e: any) {
          console.log(`Error saving file ${curFile.path}. ${e.message}`);
        }
      }, ms);
    }
  });
};
