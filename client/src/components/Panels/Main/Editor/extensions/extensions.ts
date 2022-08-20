import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
} from "@codemirror/view";
import { Extension, EditorState } from "@codemirror/state";
import { history, historyKeymap } from "@codemirror/history";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { indentOnInput, indentUnit } from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { lintKeymap } from "@codemirror/lint";
import { python } from "@codemirror/lang-python";

// Packages we customized/added
import { indentWithTab } from "@codemirror/commands";
import { rust } from "./lang";
import { highlightSelectionMatches, searchKeymap } from "./search";

export const defaultExtensions = (): Extension[] => {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    defaultHighlightStyle.fallback,
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...defaultKeymap,
      ...closeBracketsKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...commentKeymap,
      ...completionKeymap,
      ...lintKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
  ];
};

export const rustExtensions = () => {
  return [rust(), indentUnit.of("    ")];
};

export const pythonExtensions = () => {
  return [python()];
};
