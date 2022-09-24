import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import * as monaco from "monaco-editor";

import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import {
  Lang,
  PgCommon,
  PgExplorer,
  PgPkg,
  PgTerminal,
  PkgName,
} from "../../../../../utils/pg";
import { EventName } from "../../../../../constants";

const Monaco = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);

  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();

  const monacoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      lib: ["es2015"],
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2017,
      allowNonTsExtensions: true,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      lib: ["es2015"],
      allowNonTsExtensions: true,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [
        1375, // top level await
      ],
    });
  }, []);

  useEffect(() => {
    if (editor || !monacoRef.current) return;

    setEditor(
      monaco.editor.create(monacoRef.current, {
        theme: "vs-dark",
        automaticLayout: true,
      })
    );
  }, [editor]);

  // Set editor state
  useEffect(() => {
    if (!editor || !explorer) return;

    // Get current file
    const curFile = explorer.getCurrentFile();
    if (!curFile) return;

    // Open all parents
    PgExplorer.openAllParents(curFile.path);

    // Change selected
    // won't work on mount
    const newEl = PgExplorer.getElFromPath(curFile.path);
    if (newEl) PgExplorer.setSelectedEl(newEl);

    // Set editor value
    editor.setValue(curFile.content!);

    const model = editor.getModel();
    if (!model) return;

    // Set language
    switch (explorer.getCurrentFileLanguage()) {
      case Lang.RUST: {
        monaco.editor.setModelLanguage(model, "rust");
        break;
      }

      case Lang.PYTHON: {
        monaco.editor.setModelLanguage(model, "python");
        break;
      }

      case Lang.JAVASCRIPT: {
        monaco.editor.setModelLanguage(model, "javascript");
        break;
      }

      case Lang.TYPESCRIPT: {
        monaco.editor.setModelLanguage(model, "typescript");
      }
    }

    // Scroll to the top line number
    const topLineNumber = explorer.getEditorTopLineNumber(curFile.path);
    const pos = topLineNumber ? editor.getTopForLineNumber(topLineNumber) : 0;
    editor.setScrollTop(pos);

    // Save top line number
    const topLineIntervalId = setInterval(() => {
      explorer.saveEditorTopLineNumber(
        curFile.path,
        editor.getVisibleRanges()[0].startLineNumber
      );
    }, 1000);

    return () => clearInterval(topLineIntervalId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, explorer, explorerChanged]);

  // Auto save
  useEffect(() => {
    if (!editor || !explorer) return;
    const curFile = explorer?.getCurrentFile();
    if (!curFile) return;

    let timeoutId: NodeJS.Timeout;

    const disposable = editor.onDidChangeModelContent(() => {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const args: [string, string] = [curFile.path, editor.getValue()];

        // Save to state
        explorer.saveFileToState(...args);

        // Save to IndexedDb
        explorer
          .saveFileToIndexedDB(...args)
          .catch((e: any) =>
            console.log(`Error saving file ${curFile.path}. ${e.message}`)
          );
      }, 500);
    });

    return () => {
      clearTimeout(timeoutId);
      disposable.dispose();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, explorer, explorerChanged]);

  // Editor custom events
  useEffect(() => {
    if (!editor) return;

    const handleFocus = () => {
      if (!editor.hasTextFocus()) editor.focus();
    };

    document.addEventListener(EventName.EDITOR_FOCUS, handleFocus);
    return () => {
      document.removeEventListener(EventName.EDITOR_FOCUS, handleFocus);
    };
  }, [editor]);

  // Format event
  useEffect(() => {
    const handleEditorFormat = (
      e: UIEvent & { detail: { lang: Lang; fromTerminal: boolean } | null }
    ) => {
      PgTerminal.run(async () => {
        if (!editor || !explorer) return;

        let formatRust;
        const isCurrentFileRust = explorer.isCurrentFileRust();
        if (isCurrentFileRust) {
          formatRust = async () => {
            const currentContent = editor.getValue();
            const model = editor.getModel();
            if (!model) return;

            const { rustfmt } = await PgPkg.loadPkg(PkgName.RUSTFMT);

            let result;
            try {
              result = rustfmt!(currentContent);
            } catch (e: any) {
              result = { error: () => e.message };
            }
            if (result.error()) {
              PgTerminal.logWasm(
                PgTerminal.error("Unable to format the file.")
              );
              return;
            }

            if (e.detail?.fromTerminal) {
              PgTerminal.logWasm(PgTerminal.success("Format successful."));
            }

            const pos = editor.getPosition();
            if (!pos) return;
            let cursorOffset = model.getOffsetAt(pos);
            const currentLine = model.getLineContent(pos.lineNumber);
            const beforeLine = model.getLineContent(pos.lineNumber - 1);
            const afterLine = model.getLineContent(pos.lineNumber + 1);
            const searchText = [beforeLine, currentLine, afterLine].reduce(
              (acc, cur) => acc + cur + "\n",
              ""
            );

            const formattedCode = result.code!();
            const searchIndex = formattedCode.indexOf(searchText);
            if (searchIndex !== -1) {
              // Check if there are multiple instances of the same searchText
              const nextSearchIndex = formattedCode.indexOf(
                searchText,
                searchIndex + searchText.length
              );
              if (nextSearchIndex === -1) {
                cursorOffset =
                  searchIndex +
                  cursorOffset -
                  model.getOffsetAt({
                    lineNumber: pos.lineNumber - 1,
                    column: 0,
                  });
              }
            }

            const endLineNumber = model.getLineCount();
            const endColumn = model.getLineContent(endLineNumber).length + 1;

            // Execute edits pushes the changes to the undo stack
            editor.executeEdits(null, [
              {
                text: formattedCode,
                range: {
                  startLineNumber: 1,
                  endLineNumber,
                  startColumn: 0,
                  endColumn,
                },
              },
            ]);

            const resultPos = model.getPositionAt(cursorOffset);
            editor.setPosition(resultPos);
          };
        }

        let formatJSTS;
        const isCurrentFileJSTS =
          explorer.isCurrentFileTypescript() ||
          explorer.isCurrentFileJavascript();
        if (isCurrentFileJSTS) {
          formatJSTS = async () => {
            const currentContent = editor.getValue();

            const model = editor.getModel();
            if (!model) return;

            const { formatWithCursor } = await import("prettier/standalone");
            const { default: parserTypescript } = await import(
              "prettier/parser-typescript"
            );

            const pos = editor.getPosition() ?? { lineNumber: 1, column: 0 };

            const result = formatWithCursor(currentContent, {
              parser: "typescript",
              plugins: [parserTypescript],
              cursorOffset: model.getOffsetAt(pos),
            });

            if (e.detail?.fromTerminal) {
              PgTerminal.logWasm(PgTerminal.success("Format successful."));
            }

            const endLineNumber = model.getLineCount();
            const endColumn = model.getLineContent(endLineNumber).length + 1;

            // Execute edits pushes the changes to the undo stack
            editor.executeEdits(null, [
              {
                text: result.formatted,
                range: {
                  startLineNumber: 1,
                  endLineNumber,
                  startColumn: 0,
                  endColumn,
                },
              },
            ]);

            const resultPos = model.getPositionAt(result.cursorOffset);
            editor.setPosition(resultPos);
          };
        }

        // From keybind
        if (!e.detail) {
          if (isCurrentFileRust) {
            formatRust && (await formatRust());
          } else if (isCurrentFileJSTS) {
            formatJSTS && (await formatJSTS());
          }

          return;
        }

        // From terminal
        switch (e.detail.lang) {
          case Lang.RUST: {
            if (!isCurrentFileRust) {
              PgTerminal.logWasm(
                PgTerminal.warning("Current file is not a Rust file.")
              );
              return;
            }

            formatRust && (await formatRust());
            break;
          }

          case Lang.TYPESCRIPT: {
            if (!isCurrentFileJSTS) {
              PgTerminal.logWasm(
                PgTerminal.warning("Current file is not a JS/TS file.")
              );
              return;
            }

            formatJSTS && (await formatJSTS());
          }
        }
      });
    };

    const handleFormatOnKeybind = (e: KeyboardEvent) => {
      if (PgCommon.isKeyCtrlOrCmd(e)) {
        const key = e.key.toUpperCase();
        if (key === "S") {
          e.preventDefault();
          if (editor?.hasTextFocus()) {
            PgCommon.createAndDispatchCustomEvent(EventName.EDITOR_FORMAT);
          }
        }
      }
    };

    document.addEventListener(
      EventName.EDITOR_FORMAT,
      handleEditorFormat as EventListener
    );
    document.addEventListener("keydown", handleFormatOnKeybind);
    return () => {
      document.removeEventListener(
        EventName.EDITOR_FORMAT,
        handleEditorFormat as EventListener
      );
      document.removeEventListener("keydown", handleFormatOnKeybind);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, explorer, explorerChanged]);

  return <div ref={monacoRef} />;
};

export default Monaco;
