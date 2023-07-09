import * as monaco from "monaco-editor";
import {
  loadWASM,
  createOnigScanner,
  createOnigString,
} from "vscode-oniguruma";
import {
  INITIAL,
  Registry,
  parseRawGrammar,
  StateStack,
} from "vscode-textmate";
import { Disposable } from "../../../../../utils/pg";

import { LANGUAGES } from "./languages";

/**
 * Initialize language grammars and configurations.
 *
 * Initialization must happen before creating the editor.
 */
export const initLanguages = async (): Promise<Disposable> => {
  // Load oniguruma
  const resp = await fetch(
    require("vscode-oniguruma/release/onig.wasm?resource")
  );
  await loadWASM(resp);

  const registry = new Registry({
    onigLib: Promise.resolve({
      createOnigScanner,
      createOnigString,
    }),
    loadGrammar: async (scopeName: string) => {
      const grammar = await import(`./${scopeName}/grammar.json`);
      return parseRawGrammar(JSON.stringify(grammar), "grammar.json");
    },
  });

  // Register languages
  const disposables: monaco.IDisposable[] = [];
  for (const languageId of LANGUAGES) {
    const disposable = monaco.languages.onLanguage(languageId, async () => {
      // Using `loadGrammar` cause `onEnterRules` to not be respected. Using
      // `loadGrammarWithConfiguration` solves the problem.
      const grammar = await registry.loadGrammarWithConfiguration(
        languageId,
        monaco.languages.getEncodedLanguageId(languageId),
        {}
      );
      if (!grammar) return;

      // Set tokens
      monaco.languages.setTokensProvider(languageId, {
        getInitialState: () => INITIAL,
        tokenizeEncoded: (line: string, state: monaco.languages.IState) => {
          const { tokens, ruleStack: endState } = grammar.tokenizeLine2(
            line,
            state as StateStack
          );
          return { tokens, endState };
        },
      });

      // Set configuration
      const configuration = await import(`./${languageId}/configuration.json`);
      monaco.languages.setLanguageConfiguration(languageId, configuration);
    });
    disposables.push(disposable);
  }

  return {
    dispose: () => disposables.forEach((disposable) => disposable.dispose()),
  };
};
