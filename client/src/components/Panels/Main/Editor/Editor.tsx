import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css, useTheme } from "styled-components";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import Home from "./Home";
import Theme from "../../../../theme/interface";
import { Wormhole } from "../../../Loading";
import {
  autosave,
  defaultExtensions,
  rustExtensions,
  pythonExtensions,
} from "./extensions";
import {
  buildCountAtom,
  explorerAtom,
  refreshExplorerAtom,
} from "../../../../state";
import { PgExplorer, PgProgramInfo, PgEditor } from "../../../../utils/pg";

const Editor = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);
  // Update programId on each build
  const [buildCount] = useAtom(buildCountAtom);

  const [mount, setMount] = useState(0);
  const [noOpenTabs, setNoOpenTabs] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const theme = useTheme() as Theme;

  const editorTheme = useMemo(() => {
    return EditorView.theme(
      {
        // Editor
        "&": {
          height: "100%",
          backgroundColor:
            theme.colors.editor?.bg ?? theme.colors.default.bgPrimary,
          color: theme.colors.editor?.color ?? theme.colors.default.textPrimary,
        },
        // Cursor
        "& .cm-cursor": {
          borderLeft:
            "2px solid " +
            (theme.colors.editor?.cursor?.color ??
              theme.colors.default.textSecondary),
        },
        // Gutters
        "& .cm-gutters": {
          backgroundColor: theme.colors.editor?.gutter?.bg ?? "inherit",
          color:
            theme.colors.editor?.gutter?.color ??
            theme.colors.default.textSecondary,
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
          backgroundColor: theme.colors.editor?.activeLine?.bg ?? "inherit",
          borderColor:
            theme.colors.editor?.activeLine?.borderColor ?? "transparent",
          borderRightColor: "transparent",
          borderLeftColor: "transparent",
        },
        // Selection
        "& .cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
          backgroundColor:
            theme.colors.editor?.selection?.bg ??
            theme.colors.default.primary + theme.transparency?.medium,
          color: theme.colors.editor?.selection?.color ?? "inherit",
        },
        "& .cm-selectionMatch": {
          backgroundColor:
            theme.colors.editor?.selection?.bg ??
            theme.colors.default.textPrimary + theme.transparency?.medium,
          color: theme.colors.editor?.selection?.color ?? "inherit",
        },
        // Tooltip
        ".cm-tooltip": {
          backgroundColor:
            theme.colors.editor?.tooltip?.bg ?? theme.colors.default.bgPrimary,
          color: theme.colors.default.textPrimary,
          border: "1px solid " + theme.colors.default.borderColor,
        },
        ".cm-tooltip-autocomplete": {
          "& > ul > li[aria-selected]": {
            backgroundColor:
              theme.colors.default.primary + theme.transparency?.medium,
          },
        },
        // Panels
        ".cm-panels": {
          backgroundColor: theme.colors.default.bgSecondary ?? "inherit",
          color: theme.colors.default.textPrimary,
          width: "fit-content",
          height: "fit-content",
          position: "fixed",
          top: 0,
          right: "10%",
          left: "auto",
        },
        // Search
        ".cm-searchMatch": {
          backgroundColor:
            theme.colors.editor?.searchMatch?.bg ??
            theme.colors.default.textSecondary + theme.transparency?.medium,
          color: theme.colors?.editor?.searchMatch?.color ?? "inherit",
        },
        ".cm-searchMatch-selected": {
          backgroundColor:
            theme.colors.editor?.searchMatch?.selectedBg ??
            theme.colors.default.primary + theme.transparency?.medium,
          color: theme.colors?.editor?.searchMatch?.color ?? "inherit",
        },
        // Search popup
        ".cm-panel.cm-search": {
          backgroundColor: theme.colors.default.bgSecondary ?? "inherit",

          "& input, & button, & label": {
            margin: ".2em .6em .2em 0",
          },
          "& input[type=checkbox]": {
            marginRight: ".2em",
          },
          "& label": {
            fontSize: "80%",
            whiteSpace: "pre",
          },

          "& label:nth-of-type(2)": {
            marginRight: "1.5rem",
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

            "&:hover": {
              cursor: "pointer",
              backgroundColor: theme.colors.default.bgPrimary,
            },
          },
        },
      },
      { dark: theme.isDark }
    );

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.name]);

  // Initial Mount
  useEffect(() => {
    setMount((c) => c + 1);
  }, [setMount]);

  // Mounting based on open tabs state
  useEffect(() => {
    const firstEl = parentRef.current?.firstElementChild;

    // If there is open tabs but the editor is not mounted, mount the editor.
    if (!noOpenTabs && !firstEl) setMount((c) => c + 1);
    else if (firstEl?.classList.contains(PgEditor.CLASSNAME)) {
      parentRef.current?.removeChild(firstEl);
    }
  }, [noOpenTabs, setMount]);

  // Create editor
  const editor = useMemo(() => {
    if (!explorer || !parentRef.current) return;

    // Get current file
    const curFile = explorer.getCurrentFile();
    if (!curFile) return;

    // Remove editor if it's already mounted
    if (parentRef.current?.hasChildNodes()) {
      parentRef.current.removeChild(parentRef.current.childNodes[0]);
    }

    return new EditorView({
      parent: parentRef.current,
    });

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mount, editorTheme]);

  // When user switches files or editor changed
  useEffect(() => {
    // Show home screen no tab is open
    if (!explorer?.getTabs().length) {
      setNoOpenTabs(true);
      return;
    }

    setNoOpenTabs(false);

    if (!explorer || !editor) return;

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
    const extensions = [
      defaultExtensions(),
      editorTheme,
      theme.highlight,
      autosave(explorer, curFile, 5000),
    ];
    if (explorer.isCurrentFileRust()) {
      extensions.push(rustExtensions());
    } else {
      extensions.push(pythonExtensions());
    }

    editor.setState(
      EditorState.create({
        doc: curFile.content,
        extensions,
      })
    );

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, explorer, explorerChanged, setNoOpenTabs]);

  /**
   * Update /src/lib.rs or /src/lib.py with the programId
   * Updates the content of the file in the editor and in localstorage
   * @param currentContent Current content of the file to be updated
   * @param programId The new program ID to be set
   * @param extension The extension, which determines the language of the file
   */
  const updateLib = useCallback(
    (currentContent: string, programId: string, extension: "rs" | "py") => {
      if (!explorer || !editor) return;

      const getProgramIdStartAndEndIndex = (content: string) => {
        const findTextIndex = content.indexOf(findText);
        if (!content || !findTextIndex || findTextIndex === -1) return;
        const quoteStartIndex = findTextIndex + findText.length + 1;
        const quoteChar = content[quoteStartIndex];
        const quoteEndIndex = content.indexOf(quoteChar, quoteStartIndex + 1);

        return [quoteStartIndex, quoteEndIndex];
      };

      // update in localstorage
      const findText = extension === "py" ? "declare_id" : "declare_id!";
      let indices = getProgramIdStartAndEndIndex(currentContent);
      if (!indices) return;
      let [quoteStartIndex, quoteEndIndex] = indices;

      const updatedContent =
        currentContent.substring(0, quoteStartIndex + 1) +
        programId +
        currentContent.substring(quoteEndIndex);
      const filePath = `/src/lib.${extension}`;
      const data = explorer.files[filePath];
      if (data?.content) {
        explorer.files[filePath] = { ...data, content: updatedContent };
      }

      // update in editor
      const editorContent = editor.state.doc.toString();
      indices = getProgramIdStartAndEndIndex(editorContent);
      if (!indices) return;
      [quoteStartIndex, quoteEndIndex] = indices;

      editor.dispatch({
        changes: {
          from: quoteStartIndex + 1,
          to: quoteEndIndex,
          insert: programId,
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, explorer, explorerChanged]
  );

  // Change programId
  useEffect(() => {
    if (!explorer || !parentRef.current || !buildCount || !editor) return;

    const programPkResult = PgProgramInfo.getPk();
    if (programPkResult?.err) return;
    const programPkStr = programPkResult.programPk!.toBase58();

    const libRsContent = explorer.getFileContentFromPath("/src/lib.rs");
    if (libRsContent) {
      updateLib(libRsContent, programPkStr, "rs");
      return;
    }

    const libPyContent = explorer.getFileContentFromPath("/src/lib.py");
    if (libPyContent) {
      updateLib(libPyContent, programPkStr, "py");
      return;
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildCount, editor, updateLib]);

  // Listen for custom events
  useEffect(() => {
    const handleFocus = () => {
      if (editor && !editor.hasFocus) editor.focus();
    };

    document.addEventListener(PgEditor.EVT_NAME_EDITOR_FOCUS, handleFocus);
    return () =>
      document.removeEventListener(PgEditor.EVT_NAME_EDITOR_FOCUS, handleFocus);
  }, [editor]);

  if (!explorer)
    return (
      <LoadingWrapper>
        <Wormhole size={10} />
      </LoadingWrapper>
    );

  return <Wrapper ref={parentRef}>{noOpenTabs && <Home />}</Wrapper>;
};

export const EDITOR_SCROLLBAR_WIDTH = "0.75rem";

const Wrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow: auto;
    background-color: ${({ theme }) => theme.colors.home?.bg};

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar,
    & ::-webkit-scrollbar {
      width: ${EDITOR_SCROLLBAR_WIDTH};
      height: 0.75rem;
    }

    &::-webkit-scrollbar-track,
    & ::-webkit-scrollbar-track {
      background-color: ${theme.colors.right?.bg};
      border-left: 1px solid ${theme.colors.default.borderColor};
    }

    &::-webkit-scrollbar-thumb,
    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      background-color: ${theme.scrollbar?.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover,
    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    & ::-webkit-scrollbar-corner {
      background-color: ${theme.colors.right?.bg};
    }
  `}
`;

const LoadingWrapper = styled.div`
  flex: 1;
  display: flex;
`;

export default Editor;
