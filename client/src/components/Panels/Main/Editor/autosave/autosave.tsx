import { EditorView, ViewUpdate } from "@codemirror/view";

import { Explorer, FullFile } from "../../../../../utils/pg/explorer";

const autosave = (explorer: Explorer, curFile: FullFile, ms: number) => {
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

export default autosave;
