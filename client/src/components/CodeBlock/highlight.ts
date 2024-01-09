import {
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

import { OrString, PgCommon } from "../../utils/pg";

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

  const responseWasm = await fetch(
    require("vscode-oniguruma/release/onig.wasm?resource")
  );
  setWasm(responseWasm);
  setCDN("/");

  // There is no way to not load a default theme.
  // See: https://github.com/shikijs/shiki/issues/473
  //
  // We put an empty JSON file at `/themes/dracula.json` otherwise it fails.
  highlighter = await getHighlighter({
    theme: "dracula",
    langs: [],
    paths: {
      languages: "grammars",
      themes: "themes",
    },
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
