/* eslint-disable eqeqeq */
import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Command,
  Decoration,
  DecorationSet,
  runScopeHandlers,
  KeyBinding,
} from "@codemirror/view";
import {
  EditorState,
  StateField,
  StateEffect,
  EditorSelection,
  StateCommand,
  Prec,
  Facet,
  Extension,
} from "@codemirror/state";
import {
  PanelConstructor,
  showPanel,
  Panel,
  getPanel,
} from "@codemirror/panel";
import { Text } from "@codemirror/text";
import { RangeSetBuilder } from "@codemirror/rangeset";
import elt from "crelt";
import { SearchCursor } from "./cursor";
import { RegExpCursor, validRegExp } from "./regexp";
import { gotoLine } from "./goto-line";
import { selectNextOccurrence } from "./selection-match";

export { highlightSelectionMatches } from "./selection-match";
export { SearchCursor, RegExpCursor, gotoLine, selectNextOccurrence };

interface SearchConfig {
  /// Whether to position the search panel at the top of the editor
  /// (the default is at the bottom).
  top?: boolean;

  /// Whether to enable case sensitivity by default when the search
  /// panel is activated (defaults to false).
  caseSensitive?: boolean;

  /// Can be used to override the way the search panel is implemented.
  /// Should create a [Panel](#panel.Panel) that contains a form
  /// which lets the user:
  ///
  /// - See the [current](#search.getSearchQuery) search query.
  /// - Manipulate the [query](#search.SearchQuery) and
  ///   [update](#search.setSearchQuery) the search state with a new
  ///   query.
  /// - Notice external changes to the query by reacting to the
  ///   appropriate [state effect](#search.setSearchQuery).
  /// - Run some of the search commands.
  createPanel?: (view: EditorView) => Panel;
}

const searchConfigFacet: Facet<
  SearchConfig,
  Required<SearchConfig>
> = Facet.define({
  combine(configs) {
    return {
      top:
        configs.reduce(
          (val, conf) => val ?? conf.top,
          undefined as boolean | undefined
        ) || false,
      caseSensitive:
        configs.reduce(
          (val, conf) => val ?? (conf.caseSensitive || (conf as any).matchCase),
          undefined as boolean | undefined
        ) || false, // FIXME remove fallback on next major,
      createPanel:
        configs.find((c) => c.createPanel)?.createPanel ||
        ((view) => new SearchPanel(view)),
    };
  },
});

/// Add search state to the editor configuration, and optionally
/// configure the search extension.
/// ([`openSearchPanel`](#search.openSearchPanel) when automatically
/// enable this if it isn't already on.)
export function search(config?: SearchConfig): Extension {
  return config
    ? [searchConfigFacet.of(config), searchExtensions]
    : searchExtensions;
}

/// @internal
export const searchConfig = search; // FIXME drop on next release

/// A search query. Part of the editor's search state.
export class SearchQuery {
  /// The search string (or regular expression).
  readonly search: string;
  /// Indicates whether the search is case-sensitive.
  readonly caseSensitive: boolean;
  /// Then true, the search string is interpreted as a regular
  /// expression.
  readonly regexp: boolean;
  /// The replace text, or the empty string if no replace text has
  /// been given.
  readonly replace: string;
  /// Whether this query is non-empty and, in case of a regular
  /// expression search, syntactically valid.
  readonly valid: boolean;

  /// @internal
  readonly unquoted: string;

  /// Create a query object.
  constructor(config: {
    /// The search string.
    search: string;
    /// Controls whether the search should be case-sensitive.
    caseSensitive?: boolean;
    /// When true, interpret the search string as a regular expression.
    regexp?: boolean;
    /// The replace text.
    replace?: string;
  }) {
    this.search = config.search;
    this.caseSensitive = !!config.caseSensitive;
    this.regexp = !!config.regexp;
    this.replace = config.replace || "";
    this.valid = !!this.search && (!this.regexp || validRegExp(this.search));
    this.unquoted = this.search.replace(/\\([nrt\\])/g, (_, ch) =>
      ch == "n" ? "\n" : ch == "r" ? "\r" : ch == "t" ? "\t" : "\\"
    );
  }

  /// Compare this query to another query.
  eq(other: SearchQuery) {
    return (
      this.search == other.search &&
      this.replace == other.replace &&
      this.caseSensitive == other.caseSensitive &&
      this.regexp == other.regexp
    );
  }

  /// @internal
  create(): QueryType {
    return this.regexp ? new RegExpQuery(this) : new StringQuery(this);
  }

  getCursor(
    doc: Text,
    from: number = 0,
    to: number = doc.length
  ): Iterator<{ from: number; to: number }> {
    return this.regexp
      ? regexpCursor(this, doc, from, to)
      : stringCursor(this, doc, from, to);
  }
}

type SearchResult = typeof SearchCursor.prototype.value;

abstract class QueryType<Result extends SearchResult = SearchResult> {
  constructor(readonly spec: SearchQuery) {}

  abstract nextMatch(doc: Text, curFrom: number, curTo: number): Result | null;

  abstract prevMatch(doc: Text, curFrom: number, curTo: number): Result | null;

  abstract getReplacement(result: Result): string;

  abstract matchAll(doc: Text, limit: number): readonly Result[] | null;

  abstract highlight(
    doc: Text,
    from: number,
    to: number,
    add: (from: number, to: number) => void
  ): void;
}

const enum FindPrev {
  ChunkSize = 10000,
}

function stringCursor(spec: SearchQuery, doc: Text, from: number, to: number) {
  return new SearchCursor(
    doc,
    spec.unquoted,
    from,
    to,
    spec.caseSensitive ? undefined : (x) => x.toLowerCase()
  );
}

class StringQuery extends QueryType<SearchResult> {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(spec: SearchQuery) {
    super(spec);
  }

  nextMatch(doc: Text, curFrom: number, curTo: number) {
    let cursor = stringCursor(
      this.spec,
      doc,
      curTo,
      doc.length
    ).nextOverlapping();
    if (cursor.done)
      cursor = stringCursor(this.spec, doc, 0, curFrom).nextOverlapping();
    return cursor.done ? null : cursor.value;
  }

  // Searching in reverse is, rather than implementing inverted search
  // cursor, done by scanning chunk after chunk forward.
  private prevMatchInRange(doc: Text, from: number, to: number) {
    for (let pos = to; ; ) {
      let start = Math.max(
        from,
        pos - FindPrev.ChunkSize - this.spec.unquoted.length
      );
      let cursor = stringCursor(this.spec, doc, start, pos),
        range: SearchResult | null = null;
      while (!cursor.nextOverlapping().done) range = cursor.value;
      if (range) return range;
      if (start == from) return null;
      pos -= FindPrev.ChunkSize;
    }
  }

  prevMatch(doc: Text, curFrom: number, curTo: number) {
    return (
      this.prevMatchInRange(doc, 0, curFrom) ||
      this.prevMatchInRange(doc, curTo, doc.length)
    );
  }

  getReplacement(_result: SearchResult) {
    return this.spec.replace;
  }

  matchAll(doc: Text, limit: number) {
    let cursor = stringCursor(this.spec, doc, 0, doc.length),
      ranges = [];
    while (!cursor.next().done) {
      if (ranges.length >= limit) return null;
      ranges.push(cursor.value);
    }
    return ranges;
  }

  highlight(
    doc: Text,
    from: number,
    to: number,
    add: (from: number, to: number) => void
  ) {
    let cursor = stringCursor(
      this.spec,
      doc,
      Math.max(0, from - this.spec.unquoted.length),
      Math.min(to + this.spec.unquoted.length, doc.length)
    );
    while (!cursor.next().done) add(cursor.value.from, cursor.value.to);
  }
}

const enum RegExp {
  HighlightMargin = 250,
}

type RegExpResult = typeof RegExpCursor.prototype.value;

function regexpCursor(spec: SearchQuery, doc: Text, from: number, to: number) {
  return new RegExpCursor(
    doc,
    spec.search,
    spec.caseSensitive ? undefined : { ignoreCase: true },
    from,
    to
  );
}

class RegExpQuery extends QueryType<RegExpResult> {
  nextMatch(doc: Text, curFrom: number, curTo: number) {
    let cursor = regexpCursor(this.spec, doc, curTo, doc.length).next();
    if (cursor.done) cursor = regexpCursor(this.spec, doc, 0, curFrom).next();
    return cursor.done ? null : cursor.value;
  }

  private prevMatchInRange(doc: Text, from: number, to: number) {
    for (let size = 1; ; size++) {
      let start = Math.max(from, to - size * FindPrev.ChunkSize);
      let cursor = regexpCursor(this.spec, doc, start, to),
        range: RegExpResult | null = null;
      while (!cursor.next().done) range = cursor.value;
      if (range && (start == from || range.from > start + 10)) return range;
      if (start == from) return null;
    }
  }

  prevMatch(doc: Text, curFrom: number, curTo: number) {
    return (
      this.prevMatchInRange(doc, 0, curFrom) ||
      this.prevMatchInRange(doc, curTo, doc.length)
    );
  }

  getReplacement(result: RegExpResult) {
    return this.spec.replace.replace(/\$([$&\d+])/g, (m, i) =>
      i == "$"
        ? "$"
        : i == "&"
        ? result.match[0]
        : i != "0" && +i < result.match.length
        ? result.match[i]
        : m
    );
  }

  matchAll(doc: Text, limit: number) {
    let cursor = regexpCursor(this.spec, doc, 0, doc.length),
      ranges = [];
    while (!cursor.next().done) {
      if (ranges.length >= limit) return null;
      ranges.push(cursor.value);
    }
    return ranges;
  }

  highlight(
    doc: Text,
    from: number,
    to: number,
    add: (from: number, to: number) => void
  ) {
    let cursor = regexpCursor(
      this.spec,
      doc,
      Math.max(0, from - RegExp.HighlightMargin),
      Math.min(to + RegExp.HighlightMargin, doc.length)
    );
    while (!cursor.next().done) add(cursor.value.from, cursor.value.to);
  }
}

/// A state effect that updates the current search query. Note that
/// this only has an effect if the search state has been initialized
/// (by including [`search`](#search.search) in your configuration or
/// by running [`openSearchPanel`](#search.openSearchPanel) at least
/// once).
export const setSearchQuery = StateEffect.define<SearchQuery>();

const togglePanel = StateEffect.define<boolean>();

const searchState: StateField<SearchState> = StateField.define<SearchState>({
  create(state) {
    return new SearchState(defaultQuery(state).create(), null);
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setSearchQuery))
        value = new SearchState(effect.value.create(), value.panel);
      else if (effect.is(togglePanel))
        value = new SearchState(
          value.query,
          effect.value ? createSearchPanel : null
        );
    }
    return value;
  },
  provide: (f) => showPanel.from(f, (val) => val.panel),
});

/// Get the current search query from an editor state.
export function getSearchQuery(state: EditorState) {
  let curState = state.field(searchState, false);
  return curState ? curState.query.spec : defaultQuery(state);
}

class SearchState {
  constructor(
    readonly query: QueryType,
    readonly panel: PanelConstructor | null
  ) {}
}

const matchMark = Decoration.mark({ class: "cm-searchMatch" }),
  selectedMatchMark = Decoration.mark({
    class: "cm-searchMatch cm-searchMatch-selected",
  });

const searchHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(readonly view: EditorView) {
      this.decorations = this.highlight(view.state.field(searchState));
    }

    update(update: ViewUpdate) {
      let state = update.state.field(searchState);
      if (
        state != update.startState.field(searchState) ||
        update.docChanged ||
        update.selectionSet
      )
        this.decorations = this.highlight(state);
    }

    highlight({ query, panel }: SearchState) {
      if (!panel || !query.spec.valid) return Decoration.none;
      let { view } = this;
      let builder = new RangeSetBuilder<Decoration>();
      for (
        let i = 0, ranges = view.visibleRanges, l = ranges.length;
        i < l;
        i++
      ) {
        let { from, to } = ranges[i];
        while (
          i < l - 1 &&
          to > ranges[i + 1].from - 2 * RegExp.HighlightMargin
        )
          to = ranges[++i].to;
        query.highlight(view.state.doc, from, to, (from, to) => {
          let selected = view.state.selection.ranges.some(
            (r) => r.from == from && r.to == to
          );
          builder.add(from, to, selected ? selectedMatchMark : matchMark);
        });
      }
      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

function searchCommand(
  f: (view: EditorView, state: SearchState) => boolean
): Command {
  return (view) => {
    let state = view.state.field(searchState, false);
    return state && state.query.spec.valid
      ? f(view, state)
      : openSearchPanel(view);
  };
}

/// Open the search panel if it isn't already open, and move the
/// selection to the first match after the current main selection.
/// Will wrap around to the start of the document when it reaches the
/// end.
export const findNext = searchCommand((view, { query }) => {
  let { from, to } = view.state.selection.main;
  let next = query.nextMatch(view.state.doc, from, to);
  if (!next || (next.from == from && next.to == to)) return false;
  view.dispatch({
    selection: { anchor: next.from, head: next.to },
    scrollIntoView: true,
    effects: announceMatch(view, next),
    userEvent: "select.search",
  });
  return true;
});

/// Move the selection to the previous instance of the search query,
/// before the current main selection. Will wrap past the start
/// of the document to start searching at the end again.
export const findPrevious = searchCommand((view, { query }) => {
  let { state } = view,
    { from, to } = state.selection.main;
  let range = query.prevMatch(state.doc, from, to);
  if (!range) return false;
  view.dispatch({
    selection: { anchor: range.from, head: range.to },
    scrollIntoView: true,
    effects: announceMatch(view, range),
    userEvent: "select.search",
  });
  return true;
});

/// Select all instances of the search query.
export const selectMatches = searchCommand((view, { query }) => {
  let ranges = query.matchAll(view.state.doc, 1000);
  if (!ranges || !ranges.length) return false;
  view.dispatch({
    selection: EditorSelection.create(
      ranges.map((r) => EditorSelection.range(r.from, r.to))
    ),
    userEvent: "select.search.matches",
  });
  return true;
});

/// Select all instances of the currently selected text.
export const selectSelectionMatches: StateCommand = ({ state, dispatch }) => {
  let sel = state.selection;
  if (sel.ranges.length > 1 || sel.main.empty) return false;
  let { from, to } = sel.main;
  let ranges = [],
    main = 0;
  for (
    let cur = new SearchCursor(state.doc, state.sliceDoc(from, to));
    !cur.next().done;

  ) {
    if (ranges.length > 1000) return false;
    if (cur.value.from == from) main = ranges.length;
    ranges.push(EditorSelection.range(cur.value.from, cur.value.to));
  }
  dispatch(
    state.update({
      selection: EditorSelection.create(ranges, main),
      userEvent: "select.search.matches",
    })
  );
  return true;
};

/// Replace the current match of the search query.
export const replaceNext = searchCommand((view, { query }) => {
  let { state } = view,
    { from, to } = state.selection.main;
  if (state.readOnly) return false;
  let next = query.nextMatch(state.doc, from, from);
  if (!next) return false;
  let changes = [],
    selection: { anchor: number; head: number } | undefined,
    replacement: Text | undefined;
  if (next.from == from && next.to == to) {
    replacement = state.toText(query.getReplacement(next));
    changes.push({ from: next.from, to: next.to, insert: replacement });
    next = query.nextMatch(state.doc, next.from, next.to);
  }
  if (next) {
    let off =
      changes.length == 0 || changes[0].from >= next.to
        ? 0
        : next.to - next.from - replacement!.length;
    selection = { anchor: next.from - off, head: next.to - off };
  }
  view.dispatch({
    changes,
    selection,
    scrollIntoView: !!selection,
    effects: next ? announceMatch(view, next) : undefined,
    userEvent: "input.replace",
  });
  return true;
});

/// Replace all instances of the search query with the given
/// replacement.
export const replaceAll = searchCommand((view, { query }) => {
  if (view.state.readOnly) return false;
  let changes = query.matchAll(view.state.doc, 1e9)!.map((match) => {
    let { from, to } = match;
    return { from, to, insert: query.getReplacement(match) };
  });
  if (!changes.length) return false;
  view.dispatch({
    changes,
    userEvent: "input.replace.all",
  });
  return true;
});

function createSearchPanel(view: EditorView) {
  return view.state.facet(searchConfigFacet).createPanel(view);
}

function defaultQuery(state: EditorState, fallback?: SearchQuery) {
  let sel = state.selection.main;
  let selText =
    sel.empty || sel.to > sel.from + 100
      ? ""
      : state.sliceDoc(sel.from, sel.to);
  let caseSensitive =
    fallback?.caseSensitive ?? state.facet(searchConfigFacet).caseSensitive;
  return fallback && !selText
    ? fallback
    : new SearchQuery({ search: selText.replace(/\n/g, "\\n"), caseSensitive });
}

/// Make sure the search panel is open and focused.
export const openSearchPanel: Command = (view) => {
  let state = view.state.field(searchState, false);
  if (state && state.panel) {
    let panel = getPanel(view, createSearchPanel);
    if (!panel) return false;
    let searchInput = panel.dom.querySelector(
      "[name=search]"
    ) as HTMLInputElement;
    if (searchInput != view.root.activeElement) {
      let query = defaultQuery(view.state, state.query.spec);
      if (query.valid) view.dispatch({ effects: setSearchQuery.of(query) });
      searchInput.focus();
      searchInput.select();
    }
  } else {
    view.dispatch({
      effects: [
        togglePanel.of(true),
        state
          ? setSearchQuery.of(defaultQuery(view.state, state.query.spec))
          : StateEffect.appendConfig.of(searchExtensions),
      ],
    });
  }
  return true;
};

/// Close the search panel.
export const closeSearchPanel: Command = (view) => {
  let state = view.state.field(searchState, false);
  if (!state || !state.panel) return false;
  let panel = getPanel(view, createSearchPanel);
  if (panel && panel.dom.contains(view.root.activeElement)) view.focus();
  view.dispatch({ effects: togglePanel.of(false) });
  return true;
};

/// Default search-related key bindings.
///
///  - Mod-f: [`openSearchPanel`](#search.openSearchPanel)
///  - F3, Mod-g: [`findNext`](#search.findNext)
///  - Shift-F3, Shift-Mod-g: [`findPrevious`](#search.findPrevious)
///  - Alt-g: [`gotoLine`](#search.gotoLine)
///  - Mod-d: [`selectNextOccurrence`](#search.selectNextOccurrence)
export const searchKeymap: readonly KeyBinding[] = [
  { key: "Mod-f", run: openSearchPanel, scope: "editor search-panel" },
  {
    key: "F3",
    run: findNext,
    shift: findPrevious,
    scope: "editor search-panel",
    preventDefault: true,
  },
  {
    key: "Mod-g",
    run: findNext,
    shift: findPrevious,
    scope: "editor search-panel",
    preventDefault: true,
  },
  { key: "Escape", run: closeSearchPanel, scope: "editor search-panel" },
  { key: "Mod-Shift-l", run: selectSelectionMatches },
  { key: "Alt-g", run: gotoLine },
  { key: "Mod-d", run: selectNextOccurrence, preventDefault: true },
];

class SearchPanel implements Panel {
  searchField: HTMLInputElement;
  replaceField: HTMLInputElement;
  caseField: HTMLInputElement;
  reField: HTMLInputElement;
  dom: HTMLElement;
  query: SearchQuery;

  constructor(readonly view: EditorView) {
    let query = (this.query = view.state.field(searchState).query.spec);
    this.commit = this.commit.bind(this);

    this.searchField = elt("input", {
      value: query.search,
      placeholder: phrase(view, "Find"),
      "aria-label": phrase(view, "Find"),
      class: "cm-textfield",
      name: "search",
      onchange: this.commit,
      onkeyup: this.commit,
    }) as HTMLInputElement;
    this.replaceField = elt("input", {
      value: query.replace,
      placeholder: phrase(view, "Replace"),
      "aria-label": phrase(view, "Replace"),
      class: "cm-textfield",
      name: "replace",
      onchange: this.commit,
      onkeyup: this.commit,
    }) as HTMLInputElement;
    this.caseField = elt("input", {
      type: "checkbox",
      name: "case",
      checked: query.caseSensitive,
      onchange: this.commit,
    }) as HTMLInputElement;
    this.reField = elt("input", {
      type: "checkbox",
      name: "re",
      checked: query.regexp,
      onchange: this.commit,
    }) as HTMLInputElement;

    function button(
      name: string,
      onclick: () => void,
      content: (Node | string)[]
    ) {
      return elt(
        "button",
        { class: "cm-button", name, onclick, type: "button" },
        content
      );
    }
    this.dom = elt(
      "div",
      { onkeydown: (e: KeyboardEvent) => this.keydown(e), class: "cm-search" },
      [
        this.searchField,
        button("next", () => findNext(view), [phrase(view, "next")]),
        button("prev", () => findPrevious(view), [phrase(view, "previous")]),
        button("select", () => selectMatches(view), [phrase(view, "all")]),
        elt("label", null, [this.caseField, phrase(view, "match case")]),
        elt("label", null, [this.reField, phrase(view, "regexp")]),
        ...(view.state.readOnly
          ? []
          : [
              elt("br"),
              this.replaceField,
              button("replace", () => replaceNext(view), [
                phrase(view, "replace"),
              ]),
              button("replaceAll", () => replaceAll(view), [
                phrase(view, "replace all"),
              ]),
              elt(
                "button",
                {
                  name: "close",
                  onclick: () => closeSearchPanel(view),
                  "aria-label": phrase(view, "close"),
                  type: "button",
                },
                ["×"]
              ),
            ]),
      ]
    );
  }

  commit() {
    let query = new SearchQuery({
      search: this.searchField.value,
      caseSensitive: this.caseField.checked,
      regexp: this.reField.checked,
      replace: this.replaceField.value,
    });
    if (!query.eq(this.query)) {
      this.query = query;
      this.view.dispatch({ effects: setSearchQuery.of(query) });
    }
  }

  keydown(e: KeyboardEvent) {
    if (runScopeHandlers(this.view, e, "search-panel")) {
      e.preventDefault();
    } else if (e.keyCode == 13 && e.target == this.searchField) {
      e.preventDefault();
      (e.shiftKey ? findPrevious : findNext)(this.view);
    } else if (e.keyCode == 13 && e.target == this.replaceField) {
      e.preventDefault();
      replaceNext(this.view);
    }
  }

  update(update: ViewUpdate) {
    for (let tr of update.transactions)
      for (let effect of tr.effects) {
        if (effect.is(setSearchQuery) && !effect.value.eq(this.query))
          this.setQuery(effect.value);
      }
  }

  setQuery(query: SearchQuery) {
    this.query = query;
    this.searchField.value = query.search;
    this.replaceField.value = query.replace;
    this.caseField.checked = query.caseSensitive;
    this.reField.checked = query.regexp;
  }

  mount() {
    this.searchField.select();
  }

  get pos() {
    return 80;
  }

  get top() {
    return this.view.state.facet(searchConfigFacet).top;
  }
}

function phrase(view: EditorView, phrase: string) {
  return view.state.phrase(phrase);
}

const AnnounceMargin = 30;

// eslint-disable-next-line no-useless-escape
const Break = /[\s\.,:;?!]/;

function announceMatch(
  view: EditorView,
  { from, to }: { from: number; to: number }
) {
  let lineStart = view.state.doc.lineAt(from).from,
    lineEnd = view.state.doc.lineAt(to).to;
  let start = Math.max(lineStart, from - AnnounceMargin),
    end = Math.min(lineEnd, to + AnnounceMargin);
  let text = view.state.sliceDoc(start, end);
  if (start != lineStart) {
    for (let i = 0; i < AnnounceMargin; i++)
      if (!Break.test(text[i + 1]) && Break.test(text[i])) {
        text = text.slice(i);
        break;
      }
  }
  if (end != lineEnd) {
    for (let i = text.length - 1; i > text.length - AnnounceMargin; i--)
      if (!Break.test(text[i - 1]) && Break.test(text[i])) {
        text = text.slice(0, i);
        break;
      }
  }

  return EditorView.announce.of(
    `${view.state.phrase("current match")}. ${text} ${view.state.phrase(
      "on line"
    )} ${view.state.doc.lineAt(from).number}`
  );
}

const searchExtensions = [searchState, Prec.lowest(searchHighlighter)];
