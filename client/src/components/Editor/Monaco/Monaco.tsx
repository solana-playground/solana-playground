import { useEffect, useRef, useState } from "react";
import styled, { useTheme } from "styled-components";
import * as monaco from "monaco-editor";

import { initLanguages } from "./languages";
import { SpinnerWithBg } from "../../Loading";
import { EventName } from "../../../constants";
import {
  Lang,
  PgCommand,
  PgCommon,
  PgExplorer,
  PgPackage,
  PgProgramInfo,
  PgTerminal,
  PgTheme,
} from "../../../utils/pg";
import {
  useAsyncEffect,
  useKeybind,
  useSendAndReceiveCustomEvent,
} from "../../../hooks";

const Monaco = () => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const [isThemeSet, setIsThemeSet] = useState(false);

  const monacoRef = useRef<HTMLDivElement>(null);

  // Set default options
  useEffect(() => {
    // Compiler options
    const compilerOptions: monaco.languages.typescript.CompilerOptions = {
      lib: ["es2020"],
      target: monaco.languages.typescript.ScriptTarget.ES2017,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      allowSyntheticDefaultImports: true,
    };
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      compilerOptions
    );
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
      compilerOptions
    );

    // Diagnostic options
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [
        1375, // top level await
        2686, // UMD global because of module
      ],
    });
  }, []);

  const theme = useTheme();

  // Set theme
  useAsyncEffect(async () => {
    const editorStyles = theme.components.editor;

    if (theme.isDark) {
      /** Convert the colors to hex values when necessary */
      const toHexColors = (colors: Record<string, string>) => {
        for (const key in colors) {
          const color = colors[key];
          colors[key] =
            color === "transparent" || color === "inherit"
              ? "#00000000"
              : color;
        }

        return colors;
      };

      monaco.editor.defineTheme(theme.name, {
        base: "vs-dark",
        inherit: true,
        colors: toHexColors({
          /////////////////////////////// General //////////////////////////////
          foreground: editorStyles.default.color,
          errorForeground: theme.colors.state.error.color,
          descriptionForeground: theme.colors.default.textSecondary,
          focusBorder:
            theme.colors.default.primary + theme.default.transparency!.high,

          /////////////////////////////// Editor ///////////////////////////////
          "editor.foreground": editorStyles.default.color,
          "editor.background": editorStyles.default.bg,
          "editorCursor.foreground": editorStyles.default.cursorColor,
          "editor.lineHighlightBackground": editorStyles.default.activeLine.bg,
          "editor.lineHighlightBorder":
            editorStyles.default.activeLine.borderColor,
          "editor.selectionBackground": editorStyles.default.selection.bg,
          "editor.inactiveSelectionBackground":
            editorStyles.default.searchMatch.bg,
          "editorGutter.background": editorStyles.gutter.bg,
          "editorLineNumber.foreground": editorStyles.gutter.color,
          "editorError.foreground": theme.colors.state.error.color,
          "editorWarning.foreground": theme.colors.state.warning.color,

          ////////////////////////////// Dropdown //////////////////////////////
          "dropdown.background": editorStyles.tooltip.bg,
          "dropdown.foreground": editorStyles.tooltip.color,

          /////////////////////////////// Widget ///////////////////////////////
          "editorWidget.background": editorStyles.tooltip.bg,
          "editorHoverWidget.background": editorStyles.tooltip.bg,
          "editorHoverWidget.border": editorStyles.tooltip.borderColor,

          //////////////////////////////// List ////////////////////////////////
          "list.hoverBackground": theme.colors.state.hover.bg!,
          "list.activeSelectionBackground": editorStyles.tooltip.selectedBg,
          "list.activeSelectionForeground": editorStyles.tooltip.selectedColor,
          "list.inactiveSelectionBackground": editorStyles.tooltip.bg,
          "list.inactiveSelectionForeground": editorStyles.tooltip.color,
          "list.highlightForeground": theme.colors.state.info.color,

          //////////////////////////////// Input ///////////////////////////////
          "input.background": theme.components.input.bg!,
          "input.foreground": theme.components.input.color,
          "input.border": theme.components.input.borderColor,
          "inputOption.activeBorder":
            theme.colors.default.primary + theme.default.transparency.high,
          "input.placeholderForeground": theme.colors.default.textSecondary,
          "inputValidation.infoBackground": theme.colors.state.info.bg!,
          "inputValidation.infoBorder": theme.colors.state.info.color,
          "inputValidation.warningBackground": theme.colors.state.warning.bg!,
          "inputValidation.warningBorder": theme.colors.state.warning.color,
          "inputValidation.errorBackground": theme.colors.state.error.bg!,
          "inputValidation.errorBorder": theme.colors.state.error.color,

          /////////////////////////////// Minimap //////////////////////////////
          "minimap.background": editorStyles.minimap.bg,
          "minimap.selectionHighlight": editorStyles.minimap.selectionHighlight,

          ////////////////////////////// Peek view /////////////////////////////
          "peekView.border": editorStyles.peekView.borderColor,
          "peekViewTitle.background": editorStyles.peekView.title.bg,
          "peekViewTitleLabel.foreground":
            editorStyles.peekView.title.labelColor,
          "peekViewTitleDescription.foreground":
            editorStyles.peekView.title.descriptionColor,
          "peekViewEditor.background": editorStyles.peekView.editor.bg,
          "peekViewEditor.matchHighlightBackground":
            editorStyles.peekView.editor.matchHighlightBg,
          "peekViewEditorGutter.background":
            editorStyles.peekView.editor.gutterBg,
          "peekViewResult.background": editorStyles.peekView.result.bg,
          "peekViewResult.lineForeground":
            editorStyles.peekView.result.lineColor,
          "peekViewResult.fileForeground":
            editorStyles.peekView.result.fileColor,
          "peekViewResult.selectionBackground":
            editorStyles.peekView.result.selectionBg,
          "peekViewResult.selectionForeground":
            editorStyles.peekView.result.selectionColor,
          "peekViewResult.matchHighlightBackground":
            editorStyles.peekView.result.matchHighlightBg,

          ////////////////////////////// Inlay hint ////////////////////////////
          "editorInlayHint.background": editorStyles.inlayHint.bg,
          "editorInlayHint.foreground": editorStyles.inlayHint.color,
          "editorInlayHint.parameterBackground":
            editorStyles.inlayHint.parameterBg,
          "editorInlayHint.parameterForeground":
            editorStyles.inlayHint.parameterColor,
          "editorInlayHint.typeBackground": editorStyles.inlayHint.typeBg,
          "editorInlayHint.typeForeground": editorStyles.inlayHint.typeColor,
        }),
        rules: [],
      });
      monaco.editor.setTheme(theme.name);
    } else {
      monaco.editor.setTheme("vs");
    }

    // Initialize language grammars and configurations
    const { dispose } = await PgCommon.transition(() => {
      return initLanguages(PgTheme.convertToTextMateTheme(theme));
    });

    setIsThemeSet(true);

    return () => dispose();
  }, [theme]);

  // Set font
  useEffect(() => {
    editor?.updateOptions({
      fontFamily: theme.components.editor.default.fontFamily,
    });
  }, [editor, theme]);

  // Set tab size
  useEffect(() => {
    if (!editor) return;

    const { dispose } = editor.onDidChangeModel((ev) => {
      if (!ev.newModelUrl) return;

      const model = monaco.editor.getModel(ev.newModelUrl);
      if (!model) return;

      switch (model.getLanguageId()) {
        case "javascript":
        case "typescript":
        case "json":
          model.updateOptions({ tabSize: 2 });
      }
    });

    return () => dispose();
  }, [editor]);

  // Create editor
  useEffect(() => {
    if (editor || !isThemeSet || !monacoRef.current) return;

    setEditor(
      monaco.editor.create(monacoRef.current, {
        automaticLayout: true,
        fontLigatures: true,
      })
    );
  }, [editor, isThemeSet]);

  // Dispose editor
  useEffect(() => {
    if (editor) return () => editor.dispose();
  }, [editor]);

  // Set editor state
  useEffect(() => {
    if (!editor) return;
    let positionDataIntervalId: NodeJS.Timer;

    const switchFile = PgExplorer.onDidOpenFile((curFile) => {
      // Clear previous state
      if (positionDataIntervalId) clearInterval(positionDataIntervalId);

      if (!curFile) return;

      // FIXME: TS assumes the file is a script(with global scoping rules) if
      // there are no `import` or `export` statements. This results with problems
      // such as conflicting declarations and getting autocompletion for variables
      // that are not actually in scope.
      //
      // `moduleDetection` compiler option has been added in TypeScript 4.7
      // (https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#control-over-module-detection)
      // but it is not yet available in Monaco editor.
      //
      // In order to fix this issue, dispose all of the other JS/TS models if
      // the current file is a JS/TS file. Unfortunately, this causes flickering
      // when switching between JS/TS files because models are being disposed and
      // recreated each time instead of only the first time.
      // https://github.com/microsoft/monaco-editor/issues/1083
      if (PgExplorer.isFileJsLike(curFile.path)) {
        monaco.editor
          .getModels()
          .filter((model) => {
            return (
              // Only check client and tests dir otherwise `target/types` model
              // will also get disposed
              (model.uri.path.includes(PgExplorer.PATHS.CLIENT_DIRNAME) ||
                model.uri.path.includes(PgExplorer.PATHS.TESTS_DIRNAME)) &&
              PgExplorer.isFileJsLike(model.uri.path) &&
              model.uri.path !== curFile.path &&
              !model.getValue().includes("import")
            );
          })
          .forEach((model) => model.dispose());
      }

      // Check whether the model has already been created
      const model =
        monaco.editor
          .getModels()
          .find((model) => model.uri.path === curFile.path) ??
        monaco.editor.createModel(
          curFile.content!,
          undefined,
          monaco.Uri.parse(curFile.path)
        );
      editor.setModel(model);

      // Get position data
      const position = PgExplorer.getEditorPosition(curFile.path);

      // Scroll to the saved line
      editor.setScrollTop(
        position.topLineNumber
          ? editor.getTopForLineNumber(position.topLineNumber)
          : 0
      );

      // Set the cursor position
      const startPosition = model.getPositionAt(position.cursor.from);
      const endPosition = model.getPositionAt(position.cursor.to);
      editor.setSelection({
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column,
      });

      // Focus the editor
      editor.focus();

      // Save position data
      positionDataIntervalId = setInterval(() => {
        const selection = editor.getSelection();
        if (!selection) return;

        PgExplorer.saveEditorPosition(curFile.path, {
          cursor: {
            from: model.getOffsetAt(selection.getStartPosition()),
            to: model.getOffsetAt(selection.getEndPosition()),
          },
          topLineNumber: editor.getVisibleRanges()[0].startLineNumber,
        });
      }, 1000);
    });

    const disposeModelsFromPath = (path: string) => {
      // Dispose self and all child models
      monaco.editor
        .getModels()
        .filter((model) => model.uri.path.startsWith(path))
        .forEach((model) => model.dispose());
    };
    const renameItem = PgExplorer.onDidRenameItem(disposeModelsFromPath);
    const deleteItem = PgExplorer.onDidDeleteItem(disposeModelsFromPath);

    return () => {
      clearInterval(positionDataIntervalId);
      switchFile.dispose();
      renameItem.dispose();
      deleteItem.dispose();
      monaco.editor.getModels().forEach((model) => model.dispose());
    };
  }, [editor]);

  // Auto save
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;

    const { dispose } = editor.onDidChangeModelContent(() => {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (!PgExplorer.currentFilePath) return;

        const args: [string, string] = [
          PgExplorer.currentFilePath,
          editor.getValue(),
        ];

        // Save to state
        PgExplorer.saveFileToState(...args);

        // Saving to state is enough if it's a temporary project
        if (PgExplorer.isTemporary) return;

        // Save to `indexedDB`
        try {
          await PgExplorer.fs.writeFile(...args);
        } catch (e: any) {
          console.log(
            `Error saving file ${PgExplorer.currentFilePath}. ${e.message}`
          );
        }
      }, 500);
    });

    return () => {
      clearTimeout(timeoutId);
      dispose();
    };
  }, [editor]);

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
  useSendAndReceiveCustomEvent(
    EventName.EDITOR_FORMAT,
    async (ev?: { lang: Lang; fromTerminal: boolean }) => {
      if (!editor) return;

      const lang = PgExplorer.getCurrentFileLanguage();
      if (!lang) return;

      let formatRust;
      const isCurrentFileRust = lang === Lang.RUST;
      if (isCurrentFileRust) {
        formatRust = async () => {
          const currentContent = editor.getValue();
          const model = editor.getModel();
          if (!model) return;

          const { rustfmt } = await PgPackage.import("rustfmt");

          let result;
          try {
            result = rustfmt(currentContent);
          } catch (e: any) {
            result = { error: () => e.message };
          }
          if (result.error()) {
            PgTerminal.log(PgTerminal.error("Unable to format the file."));
            return;
          }

          const pos = editor.getPosition();
          if (!pos) return;
          let cursorOffset = model.getOffsetAt(pos);

          const currentLine = model.getLineContent(pos.lineNumber);
          const beforeLine = model.getLineContent(pos.lineNumber - 1);
          const afterLine =
            pos.lineNumber === model.getLineCount()
              ? ""
              : model.getLineContent(pos.lineNumber + 1);
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

          if (ev?.fromTerminal) {
            PgTerminal.log(PgTerminal.success("Format successful."));
          }
        };
      }

      const isCurrentFileJsLike = PgExplorer.isCurrentFileJsLike();
      let formatJSTS;
      if (isCurrentFileJsLike) {
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

          if (ev?.fromTerminal) {
            PgTerminal.log(PgTerminal.success("Format successful."));
          }
        };
      }

      const isCurrentFileJSON = lang === Lang.JSON;
      let formatJSON;
      if (isCurrentFileJSON) {
        formatJSON = () => {
          const model = editor.getModel();
          if (!model) return;

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

          const formattedCode = PgCommon.prettyJSON(
            JSON.parse(editor.getValue())
          );
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

      // From keybind
      if (!ev) {
        if (isCurrentFileRust) {
          formatRust && (await formatRust());
        } else if (isCurrentFileJsLike) {
          formatJSTS && (await formatJSTS());
        } else if (isCurrentFileJSON) {
          formatJSON && formatJSON();
        }

        return;
      }

      // From terminal
      switch (ev.lang) {
        case Lang.RUST: {
          if (!isCurrentFileRust) {
            PgTerminal.log(
              PgTerminal.warning("Current file is not a Rust file.")
            );
            return;
          }

          formatRust && (await formatRust());
          break;
        }

        case Lang.TYPESCRIPT: {
          if (!isCurrentFileJsLike) {
            PgTerminal.log(
              PgTerminal.warning("Current file is not a JS/TS file.")
            );
            return;
          }

          formatJSTS && (await formatJSTS());
        }
      }
    },
    [editor]
  );

  // Format on keybind
  useKeybind(
    "Ctrl+S",
    () => {
      if (editor?.hasTextFocus()) {
        PgTerminal.process(async () => {
          await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT);
        });
      }
    },
    [editor]
  );

  // Initialize language extensions
  useEffect(() => {
    const disposables = monaco.languages.getLanguages().map((language) => {
      return monaco.languages.onLanguage(language.id, async () => {
        try {
          const { init } = await import(`./languages/${language.id}/init`);
          await init();
        } catch (e: any) {
          if (!e.message?.includes("Cannot find module")) {
            throw new Error(`Failed to initialize '${language.id}': ${e}`);
          }
        }
      });
    });

    return () => disposables.forEach(({ dispose }) => dispose());
  }, []);

  // Update program id
  useEffect(() => {
    if (!editor) return;

    const getProgramIdStartAndEndIndex = (
      content: string,
      isPython: boolean
    ) => {
      const findText = isPython ? "declare_id" : "declare_id!";
      const findTextIndex = content.indexOf(findText);
      if (!content || !findTextIndex || findTextIndex === -1) return;
      const quoteStartIndex = findTextIndex + findText.length + 1;
      const quoteChar = content[quoteStartIndex];
      const quoteEndIndex = content.indexOf(quoteChar, quoteStartIndex + 1);

      return [quoteStartIndex, quoteEndIndex];
    };

    const updateId = async () => {
      const programPkStr = PgProgramInfo.getPkStr();
      if (!programPkStr) return;

      // Update in editor
      const currentLang = PgExplorer.getCurrentFileLanguage();
      const isRust = currentLang === Lang.RUST;
      const isPython = currentLang === Lang.PYTHON;
      if (!isRust && !isPython) return;

      const editorContent = editor.getValue();
      const indices = getProgramIdStartAndEndIndex(editorContent, isPython);
      if (!indices) return;
      const [quoteStartIndex, quoteEndIndex] = indices;

      const model = editor.getModel();
      if (!model) return;

      const startPos = model.getPositionAt(quoteStartIndex + 1);
      const endPos = model.getPositionAt(quoteEndIndex);
      const range = monaco.Range.fromPositions(startPos, endPos);

      try {
        editor.executeEdits(null, [{ range, text: programPkStr }]);
      } catch (e: any) {
        console.log("Program ID update error:", e.message);
      }
    };

    const { dispose } = PgCommon.batchChanges(updateId, [
      PgCommand.build.onDidRunStart,
      PgProgramInfo.onDidChangePk,
    ]);

    return () => dispose();
  }, [editor]);

  return (
    <SpinnerWithBg loading={!isThemeSet} size="2rem">
      <Wrapper ref={monacoRef} />
    </SpinnerWithBg>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;

  /** Inlay hints */
  & span[class^="dyn-rule"],
  span[class*=" dyn-rule"] {
    font-size: 12px;
  }
`;

export default Monaco;
