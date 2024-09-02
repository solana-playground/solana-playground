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

import { RequiredKey, PgExplorer, PgCommon } from "../../../../utils/pg";

// Remove defaults https://github.com/Microsoft/monaco-editor/issues/252#issuecomment-482786867
monaco.languages.getLanguages().forEach((lang) => {
  // @ts-ignore
  lang.loader = () => ({ then: () => {} });
});

// FIXME: Builtin languages e.g. JSON override existing TextMate tokens.
// https://github.com/Microsoft/monaco-editor/issues/884

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
      const grammar = await PgCommon.fetchJSON(
        `/grammars/${scopeName}.tmLanguage.json`
      );
      // `registry.loadGrammarWithConfiguration` expects `scopeName` as the
      // first argument but we provide language id instead because grammars
      // exist in `/grammars/<LANGUAGE_ID>.tmLanguage.json`. This format allows
      // sharing grammars in `monaco` and `shiki`.
      grammar.scopeName = scopeName;
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
      {
        // Otherwise bracket colorization doesn't work
        balancedBracketSelectors: ["*"],
      }
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
    monaco.languages.setLanguageConfiguration(
      languageId,
      parseConfiguration(configuration)
    );

    // Cache
    cache.languageIds.push(languageId);
  };

  return PgExplorer.onDidOpenFile(async (file) => {
    if (!file) return;

    const extension = PgExplorer.getExtensionFromPath(file.path)
      .split(".")
      .at(-1)!;
    const lang = monaco.languages.getLanguages().find((lang) => {
      return lang.extensions?.map((ext) => ext.slice(1)).includes(extension);
    });
    if (lang) await loadGrammarAndConfiguration(lang.id);
  });
};

/**
 * Parse VSCode language configuration file to Monaco editor.
 *
 * @param configuration language configuration file
 * @returns the configuration in format that Monaco expects
 */
const parseConfiguration = (
  configuration: any
): monaco.languages.LanguageConfiguration => {
  // Clone because properties are read-only
  configuration = { ...configuration };

  /** Recursively parse object values to `RegExp` when necessary */
  const recursivelyParseRegex = (obj: Record<string, any>) => {
    for (const key in obj) {
      const value = obj[key];
      // Check whether the key is a string
      if (typeof value === "string") {
        if (
          !(
            value.startsWith("^") ||
            value.endsWith("$") ||
            value.includes("\\\\")
          )
        ) {
          continue;
        }

        obj[key] = new RegExp(value);
      }

      if (typeof value === "object" && value !== null) {
        // Check for "pattern" property
        const pattern = value.pattern;
        if (pattern) obj[key] = new RegExp(pattern);
        else recursivelyParseRegex(obj[key]);
      }
    }
  };
  recursivelyParseRegex(configuration);

  // `onEnterRules` is not mapped properly
  configuration.onEnterRules &&= configuration.onEnterRules.map((rule: any) => {
    switch (rule.action.indent) {
      case "none":
        rule.action.indentAction = monaco.languages.IndentAction.None;
        break;
      case "indent":
        rule.action.indentAction = monaco.languages.IndentAction.Indent;
        break;
      case "indentOutdent":
        rule.action.indentAction = monaco.languages.IndentAction.IndentOutdent;
        break;
      case "outdent":
        rule.action.indentAction = monaco.languages.IndentAction.Outdent;
    }

    rule.beforeText = convertToRegex(rule.beforeText);
    rule.afterText &&= convertToRegex(rule.afterText);
    rule.previousLineText &&= convertToRegex(rule.previousLineText);

    return rule;
  });

  return configuration;
};

/**
 * Convert the given field to Regex if needed.
 *
 * @param field field to convert
 * @returns converted `RegExp`
 */
const convertToRegex = (field: string | RegExp) => {
  return typeof field === "string" ? new RegExp(field) : field;
};
