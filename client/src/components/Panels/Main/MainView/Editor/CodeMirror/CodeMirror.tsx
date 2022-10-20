import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useTheme } from "styled-components";
import { EditorView } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";

import { autosave, defaultExtensions, getThemeExtension } from "./extensions";
import {
  buildCountAtom,
  explorerAtom,
  refreshExplorerAtom,
} from "../../../../../../state";
import {
  PgExplorer,
  PgProgramInfo,
  PgTerminal,
  Lang,
  PgCommon,
  PgPkg,
} from "../../../../../../utils/pg";
import { EventName } from "../../../../../../constants";

const CodeMirror = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);
  // Update programId on each build
  const [buildCount] = useAtom(buildCountAtom);

  const theme = useTheme();

  const editorTheme = useMemo(
    () =>
      EditorView.theme(
        {
          // Editor
          "&": {
            height: "100%",
            backgroundColor: theme.colors.editor?.bg!,
            color: theme.colors.editor?.color!,
          },
          // Cursor
          "& .cm-cursor": {
            borderLeft: "2px solid " + theme.colors.editor?.cursorColor!,
          },
          // Gutters
          "& .cm-gutters": {
            backgroundColor: theme.colors.editor?.gutter?.bg!,
            color: theme.colors.editor?.gutter?.color!,
            borderRight: "none",
          },
          "& .cm-activeLineGutter": {
            backgroundColor: theme.colors.editor?.gutter?.activeBg ?? "inherit",
            color:
              theme.colors.editor?.gutter?.activeColor ??
              theme.colors.default.textPrimary,
          },
          "& .cm-gutterElement:nth-child(1)": {
            padding: "0.125rem",
          },
          "& .cm-scroller": {
            fontFamily: "inherit",
          },
          // Line
          "& .cm-line": {
            border: "1.5px solid transparent",
          },
          "& .cm-activeLine": {
            backgroundColor: theme.colors.editor?.activeLine?.bg!,
            borderColor: theme.colors.editor?.activeLine?.borderColor!,
            borderRightColor: "transparent",
            borderLeftColor: "transparent",
          },
          // Selection
          "& .cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
            backgroundColor: theme.colors.editor?.selection?.bg!,
            color: theme.colors.editor?.selection?.color!,
          },
          "& .cm-selectionMatch": {
            backgroundColor: theme.colors.editor?.selection?.bg!,
            color: theme.colors.editor?.selection?.color!,
          },
          // Tooltip
          ".cm-tooltip": {
            backgroundColor: theme.colors.editor?.tooltip?.bg!,
            color: theme.colors.editor?.tooltip?.color!,
            border: "1px solid " + theme.colors.default.borderColor,
          },
          ".cm-tooltip-autocomplete": {
            "& > ul": {
              "& > li > div.cm-completionIcon": {
                marginRight: "0.5rem",
              },

              "& > li[aria-selected]": {
                backgroundColor: theme.colors.editor?.tooltip?.selectedBg!,
                color: theme.colors?.editor?.tooltip?.selectedColor!,
              },
            },
          },
          // Panels
          ".cm-panels": {
            backgroundColor: theme.colors.default.bgSecondary ?? "inherit",
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
            backgroundColor: theme.colors.editor?.searchMatch?.bg!,
            color: theme.colors?.editor?.searchMatch?.color!,
          },
          ".cm-searchMatch-selected": {
            backgroundColor:
              theme.colors.editor?.searchMatch?.selectedBg ??
              theme.colors.default.primary + theme.transparency?.medium,
            color: theme.colors?.editor?.searchMatch?.color!,
          },
          // Search popup
          ".cm-panel.cm-search": {
            backgroundColor: theme.colors.default.bgSecondary,

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
              backgroundColor: theme.colors.default.bgPrimary,
            },
          },
        },
        { dark: theme.isDark }
      ),

    //eslint-disable-next-line react-hooks/exhaustive-deps
    [theme.name]
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
    if (!explorer || !editor) return;
    let topLineIntervalId: NodeJS.Timer;

    const { dispose } = explorer.onDidSwitchFile(() => {
      // Clear previous state
      topLineIntervalId && clearInterval(topLineIntervalId);

      // Get current file
      const curFile = explorer.getCurrentFile();
      if (!curFile) return;

      // Open all parents
      PgExplorer.openAllParents(curFile.path);

      // Change selected
      // won't work on mount
      const newEl = PgExplorer.getElFromPath(curFile.path);
      if (newEl) PgExplorer.setSelectedEl(newEl);

      // Change editor state
      const languageCompartment = new Compartment();
      const extensions = [
        defaultExtensions(),
        editorTheme,
        getThemeExtension(theme.highlight),
        autosave(explorer, curFile, 500),
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
        switch (explorer.getCurrentFileLanguage()) {
          case Lang.RUST: {
            const { rustExtensions } = await import(
              "./extensions/languages/rust"
            );
            languageExtensions = rustExtensions(explorer.isWorkspaceAnchor());
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

      // Scroll to the top line number
      const topLineNumber = explorer.getEditorTopLineNumber(curFile.path);
      const pos = topLineNumber ? editor.state.doc.line(topLineNumber).from : 0;
      editor.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: "start", yMargin: 0 }),
      });

      // Save top line number
      topLineIntervalId = setInterval(() => {
        explorer.saveEditorTopLineNumber(
          curFile.path,
          editor.state.doc.lineAt(
            editor.lineBlockAtHeight(
              editor.scrollDOM.getBoundingClientRect().top - editor.documentTop
            ).from
          ).number
        );
      }, 1000);
    });

    return () => {
      clearInterval(topLineIntervalId);
      dispose();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, explorer]);

  // Change programId
  useEffect(() => {
    if (!explorer || !buildCount || !editor) return;

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

    // Update in editor
    const isLibrs = explorer.getCurrentFile()?.path.endsWith("lib.rs");
    const isPython =
      !isLibrs && explorer.getCurrentFileLanguage() === Lang.PYTHON;
    if (!isLibrs && !isPython) return;

    const editorContent = editor.state.doc.toString();
    const indices = getProgramIdStartAndEndIndex(editorContent, isPython);
    if (!indices) return;
    const [quoteStartIndex, quoteEndIndex] = indices;

    const programPkResult = PgProgramInfo.getPk();
    if (programPkResult?.err) return;
    const programPkStr = programPkResult.programPk!.toBase58();

    editor.dispatch({
      changes: {
        from: quoteStartIndex + 1,
        to: quoteEndIndex,
        insert: programPkStr,
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildCount, explorer, explorerChanged, editor]);

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
  useEffect(() => {
    const handleEditorFormat = (
      e: UIEvent & { detail: { lang: Lang; fromTerminal: boolean } | null }
    ) => {
      PgTerminal.runCmd(async () => {
        if (!editor || !explorer) return;

        const lang = explorer.getCurrentFileLanguage();
        if (!lang) return;

        let formatRust;
        const isCurrentFileRust = lang === Lang.RUST;
        if (isCurrentFileRust) {
          formatRust = async () => {
            const { rustfmt } = await PgPkg.loadPkg(PgPkg.RUSTFMT);
            const currentContent = editor.state.doc.toString();
            let result;
            try {
              result = rustfmt!(currentContent);
            } catch (e: any) {
              result = { error: () => e.message };
            }
            if (result.error()) {
              PgTerminal.log(PgTerminal.error("Unable to format the file."));
              return;
            }

            if (e.detail?.fromTerminal) {
              PgTerminal.log(PgTerminal.success("Format successful."));
            }

            const formattedCode = result.code!();

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

        const isCurrentFileJsLike = explorer.isCurrentFileJsLike();
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

            if (e.detail?.fromTerminal) {
              PgTerminal.log(PgTerminal.success("Format successful."));
            }

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
          };
        }

        const isCurrentFileJSON = lang === Lang.JSON;
        let formatJSON;
        if (isCurrentFileJSON) {
          formatJSON = () => {
            const currentContent = editor.state.doc.toString();
            const formattedCode = PgCommon.prettyJSON(
              JSON.parse(currentContent)
            );

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
        if (!e.detail) {
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
        switch (e.detail.lang) {
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
      });
    };

    const handleFormatOnKeybind = (e: KeyboardEvent) => {
      if (PgCommon.isKeyCtrlOrCmd(e)) {
        const key = e.key.toUpperCase();
        if (key === "S") {
          e.preventDefault();
          if (editor?.hasFocus) {
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
  }, [editor, explorer]);

  return <div ref={codemirrorRef} />;
};

export default CodeMirror;
