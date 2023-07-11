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
  IRawTheme,
} from "vscode-textmate";

import { LANGUAGES } from "./languages";

/**
 * Initialize language grammars and configurations.
 *
 * Initialization must happen before creating the editor.
 *
 * @param theme TextMate theme
 */
export const initLanguages = async (theme: IRawTheme) => {
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
    theme,
    loadGrammar: async (scopeName: string) => {
      const grammar = await import(`./${scopeName}/grammar.json`);
      return parseRawGrammar(JSON.stringify(grammar), "grammar.json");
    },
  });

  // Set color map
  monaco.languages.setColorMap(registry.getColorMap());

  const loadGrammarAndConfiguration = async (languageId: string) => {
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
  };

  // Register languages(only runs once per language)
  for (const languageId of LANGUAGES) {
    monaco.languages.onLanguage(languageId, async () => {
      await loadGrammarAndConfiguration(languageId);
    });
  }

  // Initialize language of each model
  for (const model of monaco.editor.getModels()) {
    await loadGrammarAndConfiguration(model.getLanguageId());
  }
};
