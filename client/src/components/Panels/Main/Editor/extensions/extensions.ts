import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
  scrollPastEnd,
} from "@codemirror/view";
import { Extension, EditorState } from "@codemirror/state";
import {
  indentOnInput,
  indentUnit,
  bracketMatching,
  foldGutter,
  foldKeymap,
  LanguageSupport,
} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
  ifNotIn,
  completeFromList,
  Completion,
} from "@codemirror/autocomplete";
import {
  highlightSelectionMatches,
  searchKeymap,
  search,
} from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";

// Langs
import { rustLanguage } from "@codemirror/lang-rust";
import { python } from "@codemirror/lang-python";
import {
  ANCHOR_SNIPPETS,
  COMMON_SNIPPETS,
  NATIVE_SNIPPETS,
  RUST_SNIPPETS,
} from "./snippets/rust";

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
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    search({ top: true }),
    scrollPastEnd(),
    keymap.of([
      ...defaultKeymap,
      ...closeBracketsKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
  ];
};

export const rustExtensions = (isAnchor: boolean) => {
  const snippets: Completion[] = RUST_SNIPPETS.concat(COMMON_SNIPPETS);
  if (isAnchor) snippets.push(...ANCHOR_SNIPPETS);
  else snippets.push(...NATIVE_SNIPPETS);

  const support = rustLanguage.data.of({
    autocomplete: ifNotIn(
      ["LineComment", "BlockComment", "String", "Char"],
      completeFromList(snippets)
    ),
  });
  return [new LanguageSupport(rustLanguage, support), indentUnit.of("    ")];
};

export const pythonExtensions = () => {
  return [python()];
};
