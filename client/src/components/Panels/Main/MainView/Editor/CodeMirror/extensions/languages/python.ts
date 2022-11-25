import { pythonLanguage } from "@codemirror/lang-python";
import {
  ifNotIn,
  completeFromList,
  Completion,
} from "@codemirror/autocomplete";
import { LanguageSupport } from "@codemirror/language";

import { PYTHON_SNIPPETS, SEAHORSE_SNIPPETS } from "../snippets/python";

export const pythonExtensions = () => {
  const snippets: Completion[] = PYTHON_SNIPPETS.concat(SEAHORSE_SNIPPETS);
  const support = pythonLanguage.data.of({
    autocomplete: ifNotIn(
      ["LineComment", "BlockComment", "String"],
      completeFromList(snippets)
    ),
  });
  return [new LanguageSupport(pythonLanguage, support)];
};
