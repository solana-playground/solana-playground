import { useEffect, useMemo, useRef, useState } from "react";
import styled, { css, useTheme } from "styled-components";
import { EditorView } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";

import { autosave, defaultExtensions, getThemeExtension } from "./extensions";
import { EventName } from "../../../constants";
import {
  PgExplorer,
  PgProgramInfo,
  PgTerminal,
  Lang,
  PgCommon,
  PgPackage,
  PgCommand,
  PgTheme,
  PgFramework,
} from "../../../utils/pg";
import { useKeybind, useSendAndReceiveCustomEvent } from "../../../hooks";

const CodeMirror = () => {
  const theme = useTheme();

  const editorTheme = useMemo(
    () => {
      const editorStyles = theme.components.editor;

      return EditorView.theme(
        {
          // Editor
          "&": {
            height: "100%",
            background: editorStyles.default.bg,
            color: editorStyles.default.color,
            fontFamily: editorStyles.default.fontFamily,
            fontSize: editorStyles.default.fontSize,
          },
          // Cursor
          "& .cm-cursor": {
            borderLeft: "2px solid " + editorStyles.default.cursorColor,
          },
          // Gutters
          "& .cm-gutters": {
            background: editorStyles.gutter.bg,
            color: editorStyles.gutter.color,
            borderRight: editorStyles.gutter.borderRight,
          },
          "& .cm-activeLineGutter": {
            background: editorStyles.gutter.activeBg,
            color: editorStyles.gutter.activeColor,
          },
          "& .cm-gutterElement:nth-child(1)": {
            padding: "0.125rem",
          },
          "& .cm-scroller": {
            fontFamily: editorStyles.default.fontFamily,
          },
          // Line
          "& .cm-line": {
            border: "1.5px solid transparent",
          },
          "& .cm-activeLine": {
            background: editorStyles.default.activeLine.bg,
            borderColor: editorStyles.default.activeLine.borderColor,
            borderRightColor: "transparent",
            borderLeftColor: "transparent",
          },
          // Selection
          "& .cm-selectionBackground, &.cm-focused .cm-selectionBackground, & .cm-selectionMatch":
            {
              background: editorStyles.default.selection.bg,
              color: editorStyles.default.selection.color,
            },
          // Tooltip
          ".cm-tooltip": {
            background: editorStyles.tooltip.bg,
            color: editorStyles.tooltip.color,
            border: "1px solid " + editorStyles.tooltip.borderColor,
          },
          ".cm-tooltip-autocomplete": {
            "& > ul": {
              "& > li > div.cm-completionIcon": {
                marginRight: "0.5rem",
              },

              "& > li[aria-selected]": {
                background: editorStyles.tooltip.selectedBg,
                color: editorStyles.tooltip.selectedColor,
              },
            },
          },
          // Panels
          ".cm-panels": {
            background: theme.colors.default.bgSecondary,
            color: theme.colors.default.textPrimary,
            width: "fit-content",
            height: "fit-content",
            position: "absolute",
            top: 0,
            right: "10%",
            left: "auto",
            zIndex: 2,
          },
          // Search
          ".cm-searchMatch": {
            background: editorStyles.default.searchMatch.bg,
            color: editorStyles.default.searchMatch.color,
          },
          ".cm-searchMatch-selected": {
            background: editorStyles.default.searchMatch.selectedBg,
            color: editorStyles.default.searchMatch.color,
          },
          // Search popup
          ".cm-panel.cm-search": {
            background: theme.colors.default.bgSecondary,

            "& input, & button, & label": {
              margin: ".2em .6em .2em 0",
            },

            "& input[type=checkbox]": {
              marginRight: ".2em",
            },

            "& label": {
              fontSize: "80%",

              "&:nth-of-type(3)": {
                marginRight: "1.5rem",
              },
            },

            "& button[name=close]": {
              position: "absolute",
              top: "0.25rem",
              right: "0.25rem",
              margin: 0,
              width: "1rem",
              height: "1rem",
              color: theme.colors.default.textPrimary,
              backgroundColor: "inherit",
              borderRadius: "0.25rem",
            },

            "& button:hover": {
              cursor: "pointer",
              background: theme.colors.default.bgPrimary,
            },
          },
        },
        { dark: theme.isDark }
      );
    },

    //eslint-disable-next-line react-hooks/exhaustive-deps
    [theme.name, theme.components.editor.default.fontFamily]
  );

  const codemirrorRef = useRef<HTMLDivElement>(null);

  const [editor, setEditor] = useState<EditorView>();

  // Create editor
  useEffect(() => {
    if (!codemirrorRef.current) return;

    if (codemirrorRef.current.hasChildNodes()) {
      codemirrorRef.current.removeChild(codemirrorRef.current.firstChild!);
    }

    setEditor(
      new EditorView({
        parent: codemirrorRef.current,
      })
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorTheme]);

  // When user switches files or editor changed
  useEffect(() => {
    if (!editor) return;
    let positionDataIntervalId: NodeJS.Timer;

    const { dispose } = PgExplorer.onDidOpenFile((curFile) => {
      if (!curFile) return;

      // Clear previous state
      positionDataIntervalId && clearInterval(positionDataIntervalId);

      // Change editor state
      const languageCompartment = new Compartment();
      const extensions = [
        defaultExtensions(),
        editorTheme,
        getThemeExtension(theme.highlight),
        autosave(curFile, 500),
        languageCompartment.of([]),
      ];

      // Create editor state
      editor.setState(
        EditorState.create({
          doc: curFile.content,
          extensions,
        })
      );

      // Lazy load language extensions
      (async () => {
        let languageExtensions;
        switch (PgExplorer.getCurrentFileLanguage()) {
          case Lang.RUST: {
            const { rustExtensions } = await import(
              "./extensions/languages/rust"
            );
            const framework = await PgFramework.getFromFiles();
            languageExtensions = rustExtensions(framework?.name === "Anchor");
            break;
          }

          case Lang.PYTHON: {
            const { pythonExtensions } = await import(
              "./extensions/languages/python"
            );
            languageExtensions = pythonExtensions();
            break;
          }

          case Lang.JAVASCRIPT: {
            const { javascriptExtensions } = await import(
              "./extensions/languages/javascript"
            );
            languageExtensions = javascriptExtensions(false);
            break;
          }

          case Lang.TYPESCRIPT: {
            const { javascriptExtensions } = await import(
              "./extensions/languages/javascript"
            );
            languageExtensions = javascriptExtensions(true);
          }
        }

        if (languageExtensions) {
          editor.dispatch({
            effects: languageCompartment.reconfigure(languageExtensions),
          });
        }
      })();

      // Get position data
      const position = PgExplorer.getEditorPosition(curFile.path);

      // Scroll to the saved position and set the cursor position
      editor.dispatch(
        {
          effects: EditorView.scrollIntoView(
            position.topLineNumber
              ? editor.state.doc.line(position.topLineNumber).from
              : 0,
            {
              y: "start",
              yMargin: 0,
            }
          ),
        },
        {
          selection: { anchor: position.cursor.from, head: position.cursor.to },
        }
      );

      // Focus the editor
      editor.focus();

      // Save position data
      positionDataIntervalId = setInterval(() => {
        PgExplorer.saveEditorPosition(curFile.path, {
          cursor: {
            from: editor.state.selection.main.anchor,
            to: editor.state.selection.main.head,
          },
          topLineNumber: editor.state.doc.lineAt(
            editor.lineBlockAtHeight(
              editor.scrollDOM.getBoundingClientRect().top - editor.documentTop
            ).from
          ).number,
        });
      }, 1000);
    });

    return () => {
      clearInterval(positionDataIntervalId);
      dispose();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Editor custom events
  useEffect(() => {
    if (!editor) return;

    const handleFocus = () => {
      if (!editor.hasFocus) editor.focus();
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
          const { rustfmt } = await PgPackage.import("rustfmt");

          const currentContent = editor.state.doc.toString();
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

          const formattedCode = result.code!();

          let cursorOffset = editor.state.selection.ranges[0].from;
          const currentLine = editor.state.doc.lineAt(cursorOffset);
          const isFirstOrLastLine =
            currentLine.number !== 1 ||
            currentLine.number !== editor.state.doc.lines;
          if (!isFirstOrLastLine) {
            const beforeLine = editor.state.doc.line(currentLine.number - 1);
            const afterLine = editor.state.doc.line(currentLine.number + 1);
            const searchText = currentContent.substring(
              beforeLine.from,
              afterLine.to
            );

            const searchIndex = formattedCode.indexOf(searchText);
            if (searchIndex !== -1) {
              // Check if there are multiple instances of the same searchText
              const nextSearchIndex = formattedCode.indexOf(
                searchText,
                searchIndex + searchText.length
              );
              if (nextSearchIndex === -1) {
                cursorOffset = searchIndex + cursorOffset - beforeLine.from;
              }
            }
          }

          editor.dispatch({
            changes: {
              from: 0,
              to: currentContent.length,
              insert: formattedCode,
            },
            selection: {
              anchor: cursorOffset,
              head: cursorOffset,
            },
          });

          if (ev?.fromTerminal) {
            PgTerminal.log(PgTerminal.success("Format successful."));
          }
        };
      }

      const isCurrentFileJsLike = PgExplorer.isCurrentFileJsLike();
      let formatJSTS;
      if (isCurrentFileJsLike) {
        formatJSTS = async () => {
          const { formatWithCursor } = await import("prettier/standalone");
          const { default: parserTypescript } = await import(
            "prettier/parser-typescript"
          );
          const currentContent = editor.state.doc.toString();
          const result = formatWithCursor(currentContent, {
            parser: "typescript",
            plugins: [parserTypescript],
            cursorOffset: editor.state.selection.ranges[0].from,
          });

          editor.dispatch({
            changes: {
              from: 0,
              to: currentContent.length,
              insert: result.formatted,
            },
            selection: {
              anchor: result.cursorOffset,
              head: result.cursorOffset,
            },
          });

          if (ev?.fromTerminal) {
            PgTerminal.log(PgTerminal.success("Format successful."));
          }
        };
      }

      const isCurrentFileJSON = lang === Lang.JSON;
      let formatJSON;
      if (isCurrentFileJSON) {
        formatJSON = () => {
          const currentContent = editor.state.doc.toString();
          const formattedCode = PgCommon.prettyJSON(JSON.parse(currentContent));

          let cursorOffset = editor.state.selection.ranges[0].from;
          const currentLine = editor.state.doc.lineAt(cursorOffset);
          if (currentLine.number !== 1) {
            const beforeLine = editor.state.doc.line(currentLine.number - 1);
            const afterLine = editor.state.doc.line(currentLine.number + 1);
            const searchText = currentContent.substring(
              beforeLine.from,
              afterLine.to
            );

            const searchIndex = formattedCode.indexOf(searchText);
            if (searchIndex !== -1) {
              // Check if there are multiple instances of the same searchText
              const nextSearchIndex = formattedCode.indexOf(
                searchText,
                searchIndex + searchText.length
              );
              if (nextSearchIndex === -1) {
                cursorOffset = searchIndex + cursorOffset - beforeLine.from;
              }
            }
          }

          editor.dispatch({
            changes: {
              from: 0,
              to: currentContent.length,
              insert: formattedCode,
            },
            selection: {
              anchor: cursorOffset,
              head: cursorOffset,
            },
          });
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
      if (editor?.hasFocus) {
        PgTerminal.process(async () => {
          await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT);
        });
      }
    },
    [editor]
  );

  // Update program id
  useEffect(() => {
    if (!editor) return;

    const getProgramIdStartAndEndIndex = (
      content: string,
      isPython?: boolean
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

      const editorContent = editor.state.doc.toString();
      const indices = getProgramIdStartAndEndIndex(editorContent, isPython);
      if (!indices) return;
      const [quoteStartIndex, quoteEndIndex] = indices;

      try {
        editor.dispatch({
          changes: {
            from: quoteStartIndex + 1,
            to: quoteEndIndex,
            insert: programPkStr,
          },
        });
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

  return <Wrapper ref={codemirrorRef} />;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({
      allChildren: true,
      borderRadius: 0,
      height: "0.75rem",
      width: "0.75rem",
    })};

    & ::-webkit-scrollbar-track {
      background: ${theme.components.main.default.bg};
      border-left: 1px solid ${theme.colors.default.border};
    }

    & ::-webkit-scrollbar-corner {
      background: ${theme.components.main.default.bg};
    }
  `}
`;

export default CodeMirror;
