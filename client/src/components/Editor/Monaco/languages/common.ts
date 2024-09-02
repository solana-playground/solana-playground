import * as monaco from "monaco-editor";

import {
  Arrayable,
  Disposable,
  PgCommon,
  SyncOrAsync,
} from "../../../../utils/pg";

/**
 * Common import implementation based on model and model's content change.
 *
 * @param update update method
 * @param language language(s) to support
 * @returns a disposable to dispose all events
 */
export const importTypes = async (
  update: (model: monaco.editor.IModel) => SyncOrAsync<void>,
  language: Arrayable<string>
): Promise<Disposable> => {
  language = PgCommon.toArray(language);

  const changeModels: monaco.IDisposable[] = [];
  const updateDisposables = new Map<monaco.Uri, monaco.IDisposable>();

  // Don't dispose `onDidCreateEditor` because it only gets initialized once
  await PgCommon.executeInitial(
    monaco.editor.onDidCreateEditor,
    async (editor) => {
      changeModels.push(
        await PgCommon.executeInitial(editor.onDidChangeModel, async () => {
          const model = editor.getModel();
          if (!model) return;

          // Check language
          const isValidLanguage = language.includes(model.getLanguageId());
          if (!isValidLanguage) return;

          const updateModel = () => update(model);
          await updateModel();

          // Check cache
          if (!updateDisposables.has(model.uri)) {
            updateDisposables.set(
              model.uri,
              model.onDidChangeContent(updateModel)
            );
          }
        })
      );
    },
    monaco.editor.getEditors()[0]
  );

  return {
    dispose: () => {
      changeModels.forEach(({ dispose }) => dispose());
      updateDisposables.forEach(({ dispose }) => dispose());
    },
  };
};
