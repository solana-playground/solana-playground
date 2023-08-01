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
import { RequiredKey, PgExplorer } from "../../../../../utils/pg";

/** Language grammar and configuration cache based on theme name */
const cache: {
  themeName: string | null;
  languageIds: string[];
} = {
  themeName: null,
  languageIds: [],
};

/**
 * Initialize language grammars and configurations.
 *
 * Initialization must happen before creating the editor.
 *
 * @param theme TextMate theme
 */
export const initLanguages = async (theme: RequiredKey<IRawTheme, "name">) => {
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
    theme,
  });

  const loadGrammarAndConfiguration = async (languageId: string) => {
    if (cache.themeName !== theme.name) {
      cache.themeName = theme.name;
      cache.languageIds = [];

      // Set color map
      monaco.languages.setColorMap(registry.getColorMap());
    }

    if (cache.languageIds.includes(languageId)) return;

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

    // Cache
    cache.languageIds.push(languageId);
  };

  return PgExplorer.onDidSwitchFile(async (file) => {
    if (!file) return;

    const lang = monaco.languages.getLanguages().find((lang) => {
      return lang.extensions
        ?.map((ext) => ext.slice(1))
        .includes(
          PgExplorer.getExtensionFromPath(file.path).split(".").reverse()[0]
        );
    });
    if (lang) await loadGrammarAndConfiguration(lang.id);
  });
};

// Remove defaults https://github.com/Microsoft/monaco-editor/issues/252#issuecomment-482786867
monaco.languages.getLanguages().forEach((lang) => {
  // @ts-ignore
  lang.loader = () => ({ then: () => {} });
});

// FIXME: Builtin languages such as JSON override existing TextMate tokens.
// https://github.com/Microsoft/monaco-editor/issues/884
