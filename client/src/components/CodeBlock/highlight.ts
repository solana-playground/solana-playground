import {
  BUNDLED_LANGUAGES,
  getHighlighter,
  Highlighter,
  Lang,
  renderToHtml,
  setCDN,
  setWasm,
  Theme,
  toShikiTheme,
} from "shiki";
import type { IRawTheme } from "vscode-textmate";

import { OrString, PgCommon } from "../../utils";

/**
 * Convert the given code to HTML.
 *
 * @param code code to highlight
 * @param lang code language or alias
 * @param theme TextMate theme
 * @returns highlighted HTML string
 */
export const highlight = async (
  code: string,
  lang: OrString<Lang>,
  theme: IRawTheme
) => {
  await initializeHighlighter();
  await Promise.all([loadLanguage(lang as Lang), loadTheme(theme)]);

  const tokens = highlighter.codeToThemedTokens(code, lang, theme.name);
  return renderToHtml(tokens, { bg: "inherit", themeName: theme.name });
};

/** `shiki` highlighter */
let highlighter: Highlighter;

/** Whether the `highlighter` is being initialized */
let isInitializing = false;

/** Get or create `shiki` highlighter. */
const initializeHighlighter = async () => {
  if (highlighter) return;

  if (isInitializing) {
    return await PgCommon.tryUntilSuccess(() => {
      if (!highlighter) throw new Error();
    }, 100);
  }

  isInitializing = true;

  // Playground serves everything itself
  setCDN("/");

  // Load `vscode-oniguruma`
  const resp = await fetch(
    require("vscode-oniguruma/release/onig.wasm?resource")
  );
  setWasm(resp);

  // There is no way to not load a default theme.
  // See: https://github.com/shikijs/shiki/issues/473
  //
  // We put an empty JSON file at `/themes/dracula.json` otherwise it fails.
  highlighter = await getHighlighter({ theme: "dracula", langs: [] });

  // Bundled languages specify grammar path as `${id}.tmLanguage.json` and
  // `shiki` looks for that exact path in `/languages` (default path). However,
  // our grammar definitions are at `/language/${id}/grammar.tmLanguage.json`,
  // which are used both by `shiki` and `monaco-editor`. To make `shiki` check
  // the correct path, we override the `path` field of bundled languages global.
  BUNDLED_LANGUAGES.forEach((lang) => {
    lang.path = PgCommon.joinPaths(lang.id, "grammar.tmLanguage.json");
  });
};

/** Load the given language if needed. */
const loadLanguage = async (lang: Lang) => {
  const isLoaded = highlighter.getLoadedLanguages().includes(lang);
  if (!isLoaded) await highlighter.loadLanguage(lang);
};

/** Load the given theme if needed. */
const loadTheme = async (theme: IRawTheme) => {
  const isLoaded = highlighter.getLoadedThemes().includes(theme.name as Theme);
  if (!isLoaded) await highlighter.loadTheme(toShikiTheme(theme));
};
