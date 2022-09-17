import { rustLanguage } from "@codemirror/lang-rust";
import {
  ifNotIn,
  completeFromList,
  Completion,
} from "@codemirror/autocomplete";
import { indentUnit, LanguageSupport } from "@codemirror/language";

import {
  ANCHOR_SNIPPETS,
  COMMON_SNIPPETS,
  NATIVE_SNIPPETS,
  RUST_SNIPPETS,
} from "../snippets/rust";

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
