import ReactMarkdown from "react-markdown";
import styled, { css } from "styled-components";
import remarkGfm from "remark-gfm";

import CodeBlock from "../CodeBlock";
import Link, { LinkProps } from "../Link";
import { PgTheme } from "../../utils/pg";

interface MarkdownProps {
  /** Markdown string */
  children: string;
  /** Make all fonts the code font */
  codeFontOnly?: boolean;
}

const Markdown = (props: MarkdownProps) => (
  <StyledMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      /** Links */
      a: (props) => <Link {...(props as LinkProps)} />,

      /** Code blocks */
      pre: (props) => {
        const codeProps = (props as any).children[0].props;
        const lang = codeProps.className?.split("-")?.at(1);
        const code = codeProps.children[0];

        return <CodeBlock lang={lang}>{code}</CodeBlock>;
      },
    }}
    {...props}
  />
);

const StyledMarkdown = styled(ReactMarkdown)<MarkdownProps>`
  ${({ theme, codeFontOnly }) => css`
    --border-radius: ${theme.default.borderRadius};
    --color-prettylights-syntax-comment: #8b949e;
    --color-prettylights-syntax-constant: #79c0ff;
    --color-prettylights-syntax-entity: #d2a8ff;
    --color-prettylights-syntax-storage-modifier-import: #c9d1d9;
    --color-prettylights-syntax-entity-tag: #7ee787;
    --color-prettylights-syntax-keyword: #ff7b72;
    --color-prettylights-syntax-string: #a5d6ff;
    --color-prettylights-syntax-variable: #ffa657;
    --color-prettylights-syntax-brackethighlighter-unmatched: #f85149;
    --color-prettylights-syntax-invalid-illegal-text: #f0f6fc;
    --color-prettylights-syntax-invalid-illegal-bg: #8e1519;
    --color-prettylights-syntax-carriage-return-text: #f0f6fc;
    --color-prettylights-syntax-carriage-return-bg: #b62324;
    --color-prettylights-syntax-string-regexp: #7ee787;
    --color-prettylights-syntax-markup-list: #f2cc60;
    --color-prettylights-syntax-markup-heading: #1f6feb;
    --color-prettylights-syntax-markup-italic: #c9d1d9;
    --color-prettylights-syntax-markup-bold: #c9d1d9;
    --color-prettylights-syntax-markup-deleted-text: #ffdcd7;
    --color-prettylights-syntax-markup-deleted-bg: #67060c;
    --color-prettylights-syntax-markup-inserted-text: #aff5b4;
    --color-prettylights-syntax-markup-inserted-bg: #033a16;
    --color-prettylights-syntax-markup-changed-text: #ffdfb6;
    --color-prettylights-syntax-markup-changed-bg: #5a1e02;
    --color-prettylights-syntax-markup-ignored-text: #c9d1d9;
    --color-prettylights-syntax-markup-ignored-bg: #1158c7;
    --color-prettylights-syntax-meta-diff-range: #d2a8ff;
    --color-prettylights-syntax-brackethighlighter-angle: #8b949e;
    --color-prettylights-syntax-sublimelinter-gutter-mark: #484f58;
    --color-prettylights-syntax-constant-other-reference-link: #a5d6ff;
    --color-fg-default: ${theme.components.markdown.color};
    --color-fg-muted: ${theme.colors.default.textSecondary};
    --color-fg-subtle: #484f58;
    --color-canvas-default: ${theme.components.markdown.bg};
    --color-canvas-subtle: ${theme.components.markdown.subtleBg};
    --color-border-default: ${theme.colors.default.border};
    --color-border-muted: ${theme.colors.default.border +
    theme.default.transparency.high};
    --color-neutral-muted: ${theme.colors.state.hover.bg};
    --color-accent-fg: ${theme.colors.default.primary};
    --color-accent-emphasis: #1f6feb;
    --color-attention-subtle: rgba(187, 128, 9, 0.15);
    --color-danger-fg: #f85149;

    & {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      margin: 0;
      line-height: 1.5;
      word-wrap: break-word;

      ${PgTheme.convertToCSS(theme.components.markdown)};
      ${codeFontOnly &&
      `
        font-family: ${theme.font.code.family} !important;
        font-size: ${theme.font.code.size.medium} !important;
      `}
    }

    .octicon {
      display: inline-block;
      fill: currentColor;
      vertical-align: text-bottom;
    }

    h1:hover .anchor .octicon-link:before,
    h2:hover .anchor .octicon-link:before,
    h3:hover .anchor .octicon-link:before,
    h4:hover .anchor .octicon-link:before,
    h5:hover .anchor .octicon-link:before,
    h6:hover .anchor .octicon-link:before {
      width: 16px;
      height: 16px;
      content: " ";
      display: inline-block;
      background: currentColor;
      -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
      mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
    }

    details,
    figcaption,
    figure {
      display: block;
    }

    summary {
      display: list-item;
    }

    [hidden] {
      display: none !important;
    }

    a {
      background: transparent;
      color: var(--color-accent-fg);
      text-decoration: none;
    }

    a:active,
    a:hover {
      outline-width: 0;
    }

    abbr[title] {
      border-bottom: none;
      text-decoration: underline dotted;
    }

    b,
    strong {
      font-weight: 600;
    }

    dfn {
      font-style: italic;
    }

    h1 {
      margin: 0.67em 0;
      font-weight: 600;
      padding-bottom: 0.3em;
      font-size: 2em;
      border-bottom: 1px solid var(--color-border-muted);
    }

    mark {
      background: var(--color-attention-subtle);
      color: var(--color-text-primary);
    }

    small {
      font-size: 90%;
    }

    sub,
    sup {
      font-size: 75%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }

    sub {
      bottom: -0.25em;
    }

    sup {
      top: -0.5em;
    }

    img {
      border-style: none;
      max-width: 100%;
      box-sizing: content-box;
      background: var(--color-canvas-default);
    }

    code,
    kbd,
    pre,
    samp {
      font-family: monospace, monospace;
      font-size: 1em;
    }

    figure {
      margin: 1em 40px;
    }

    hr {
      box-sizing: content-box;
      overflow: hidden;
      background: transparent;
      border-bottom: 1px solid var(--color-border-muted);
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background: var(--color-border-default);
      border: 0;
    }

    input {
      font: inherit;
      margin: 0;
      overflow: visible;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }

    [type="button"],
    [type="reset"],
    [type="submit"] {
      -webkit-appearance: button;
    }

    [type="button"]::-moz-focus-inner,
    [type="reset"]::-moz-focus-inner,
    [type="submit"]::-moz-focus-inner {
      border-style: none;
      padding: 0;
    }

    [type="button"]:-moz-focusring,
    [type="reset"]:-moz-focusring,
    [type="submit"]:-moz-focusring {
      outline: 1px dotted ButtonText;
    }

    [type="checkbox"],
    [type="radio"] {
      box-sizing: border-box;
      padding: 0;
    }

    [type="number"]::-webkit-inner-spin-button,
    [type="number"]::-webkit-outer-spin-button {
      height: auto;
    }

    [type="search"] {
      -webkit-appearance: textfield;
      outline-offset: -2px;
    }

    [type="search"]::-webkit-search-cancel-button,
    [type="search"]::-webkit-search-decoration {
      -webkit-appearance: none;
    }

    ::-webkit-input-placeholder {
      color: inherit;
      opacity: 0.54;
    }

    ::-webkit-file-upload-button {
      -webkit-appearance: button;
      font: inherit;
    }

    a:hover {
      text-decoration: underline;
    }

    hr::before {
      display: table;
      content: "";
    }

    hr::after {
      display: table;
      clear: both;
      content: "";
    }

    table {
      border-spacing: 0;
      border-collapse: collapse;
      display: block;
      width: max-content;
      max-width: 100%;
      overflow: auto;
    }

    td,
    th {
      padding: 0;
    }

    details summary {
      cursor: pointer;
    }

    details:not([open]) > *:not(summary) {
      display: none !important;
    }

    kbd {
      display: inline-block;
      padding: 3px 5px;
      font: 11px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
        Liberation Mono, monospace;
      line-height: 10px;
      color: var(--color-fg-default);
      vertical-align: middle;
      background: var(--color-canvas-subtle);
      border: solid 1px var(--color-neutral-muted);
      border-bottom-color: var(--color-neutral-muted);
      border-radius: var(--border-radius);
      box-shadow: inset 0 -1px 0 var(--color-neutral-muted);
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    h2 {
      font-weight: 600;
      padding-bottom: 0.3em;
      font-size: 1.5em;
      border-bottom: 1px solid var(--color-border-muted);
    }

    h3 {
      font-weight: 600;
      font-size: 1.25em;
    }

    h4 {
      font-weight: 600;
      font-size: 1em;
    }

    h5 {
      font-weight: 600;
      font-size: 0.875em;
    }

    h6 {
      font-weight: 600;
      font-size: 0.85em;
      color: var(--color-fg-muted);
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
    }

    blockquote {
      margin: 0;
      padding: 0 1em;
      color: var(--color-fg-muted);
      border-left: 0.25em solid var(--color-border-default);
    }

    ul,
    ol {
      margin-top: 0;
      margin-bottom: 0;
      padding-left: 2em;
    }

    ol ol,
    ul ol {
      list-style-type: lower-roman;
    }

    ul ul ol,
    ul ol ol,
    ol ul ol,
    ol ol ol {
      list-style-type: lower-alpha;
    }

    dd {
      margin-left: 0;
    }

    tt,
    code {
      font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
        Liberation Mono, monospace;
      font-size: 12px;
    }

    pre {
      margin-top: 0;
      margin-bottom: 0;
      font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
        Liberation Mono, monospace;
      font-size: 12px;
      word-wrap: normal;
    }

    .octicon {
      display: inline-block;
      overflow: visible !important;
      vertical-align: text-bottom;
      fill: currentColor;
    }

    ::placeholder {
      color: var(--color-fg-subtle);
      opacity: 1;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      margin: 0;
      -webkit-appearance: none;
      appearance: none;
    }

    .pl-c {
      color: var(--color-prettylights-syntax-comment);
    }

    .pl-c1,
    .pl-s .pl-v {
      color: var(--color-prettylights-syntax-constant);
    }

    .pl-e,
    .pl-en {
      color: var(--color-prettylights-syntax-entity);
    }

    .pl-smi,
    .pl-s .pl-s1 {
      color: var(--color-prettylights-syntax-storage-modifier-import);
    }

    .pl-ent {
      color: var(--color-prettylights-syntax-entity-tag);
    }

    .pl-k {
      color: var(--color-prettylights-syntax-keyword);
    }

    .pl-s,
    .pl-pds,
    .pl-s .pl-pse .pl-s1,
    .pl-sr,
    .pl-sr .pl-cce,
    .pl-sr .pl-sre,
    .pl-sr .pl-sra {
      color: var(--color-prettylights-syntax-string);
    }

    .pl-v,
    .pl-smw {
      color: var(--color-prettylights-syntax-variable);
    }

    .pl-bu {
      color: var(--color-prettylights-syntax-brackethighlighter-unmatched);
    }

    .pl-ii {
      color: var(--color-prettylights-syntax-invalid-illegal-text);
      background: var(--color-prettylights-syntax-invalid-illegal-bg);
    }

    .pl-c2 {
      color: var(--color-prettylights-syntax-carriage-return-text);
      background: var(--color-prettylights-syntax-carriage-return-bg);
    }

    .pl-sr .pl-cce {
      font-weight: bold;
      color: var(--color-prettylights-syntax-string-regexp);
    }

    .pl-ml {
      color: var(--color-prettylights-syntax-markup-list);
    }

    .pl-mh,
    .pl-mh .pl-en,
    .pl-ms {
      font-weight: bold;
      color: var(--color-prettylights-syntax-markup-heading);
    }

    .pl-mi {
      font-style: italic;
      color: var(--color-prettylights-syntax-markup-italic);
    }

    .pl-mb {
      font-weight: bold;
      color: var(--color-prettylights-syntax-markup-bold);
    }

    .pl-md {
      color: var(--color-prettylights-syntax-markup-deleted-text);
      background: var(--color-prettylights-syntax-markup-deleted-bg);
    }

    .pl-mi1 {
      color: var(--color-prettylights-syntax-markup-inserted-text);
      background: var(--color-prettylights-syntax-markup-inserted-bg);
    }

    .pl-mc {
      color: var(--color-prettylights-syntax-markup-changed-text);
      background: var(--color-prettylights-syntax-markup-changed-bg);
    }

    .pl-mi2 {
      color: var(--color-prettylights-syntax-markup-ignored-text);
      background: var(--color-prettylights-syntax-markup-ignored-bg);
    }

    .pl-mdr {
      font-weight: bold;
      color: var(--color-prettylights-syntax-meta-diff-range);
    }

    .pl-ba {
      color: var(--color-prettylights-syntax-brackethighlighter-angle);
    }

    .pl-sg {
      color: var(--color-prettylights-syntax-sublimelinter-gutter-mark);
    }

    .pl-corl {
      text-decoration: underline;
      color: var(--color-prettylights-syntax-constant-other-reference-link);
    }

    [data-catalyst] {
      display: block;
    }

    g-emoji {
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      font-size: 1em;
      font-style: normal !important;
      font-weight: 400;
      line-height: 1;
      vertical-align: -0.075em;
    }

    g-emoji img {
      width: 1em;
      height: 1em;
    }

    ::before {
      display: table;
      content: "";
    }

    ::after {
      display: table;
      clear: both;
      content: "";
    }

    > *:first-child {
      margin-top: 0 !important;
    }

    > *:last-child {
      margin-bottom: 0 !important;
    }

    a:not([href]) {
      color: inherit;
      text-decoration: none;
    }

    .absent {
      color: var(--color-danger-fg);
    }

    .anchor {
      float: left;
      padding-right: 4px;
      margin-left: -20px;
      line-height: 1;
    }

    .anchor:focus {
      outline: none;
    }

    p,
    blockquote,
    ul,
    ol,
    dl,
    table,
    pre,
    details {
      margin-top: 0;
      margin-bottom: 16px;
    }

    blockquote > :first-child {
      margin-top: 0;
    }

    blockquote > :last-child {
      margin-bottom: 0;
    }

    sup > a::before {
      content: "[";
    }

    sup > a::after {
      content: "]";
    }

    h1 .octicon-link,
    h2 .octicon-link,
    h3 .octicon-link,
    h4 .octicon-link,
    h5 .octicon-link,
    h6 .octicon-link {
      color: var(--color-fg-default);
      vertical-align: middle;
      visibility: hidden;
    }

    h1:hover .anchor,
    h2:hover .anchor,
    h3:hover .anchor,
    h4:hover .anchor,
    h5:hover .anchor,
    h6:hover .anchor {
      text-decoration: none;
    }

    h1:hover .anchor .octicon-link,
    h2:hover .anchor .octicon-link,
    h3:hover .anchor .octicon-link,
    h4:hover .anchor .octicon-link,
    h5:hover .anchor .octicon-link,
    h6:hover .anchor .octicon-link {
      visibility: visible;
    }

    h1 tt,
    h1 code,
    h2 tt,
    h2 code,
    h3 tt,
    h3 code,
    h4 tt,
    h4 code,
    h5 tt,
    h5 code,
    h6 tt,
    h6 code {
      padding: 0 0.2em;
      font-size: inherit;
    }

    ul.no-list,
    ol.no-list {
      padding: 0;
      list-style-type: none;
    }

    ol[type="1"] {
      list-style-type: decimal;
    }

    ol[type="a"] {
      list-style-type: lower-alpha;
    }

    ol[type="i"] {
      list-style-type: lower-roman;
    }

    div > ol:not([type]) {
      list-style-type: decimal;
    }

    ul ul,
    ul ol,
    ol ol,
    ol ul {
      margin-top: 0;
      margin-bottom: 0;
    }

    li > p {
      margin-top: 16px;
    }

    li + li {
      margin-top: 0.25em;
    }

    dl {
      padding: 0;
    }

    dl dt {
      padding: 0;
      margin-top: 16px;
      font-size: 1em;
      font-style: italic;
      font-weight: 600;
    }

    dl dd {
      padding: 0 16px;
      margin-bottom: 16px;
    }

    table th {
      font-weight: 600;
    }

    table th,
    table td {
      padding: 6px 13px;
      border: 1px solid var(--color-border-default);
    }

    table tr {
      background: var(--color-canvas-default);
      border-top: 1px solid var(--color-border-muted);
    }

    table tr:nth-child(2n) {
      background: var(--color-canvas-subtle);
    }

    table img {
      background: transparent;
    }

    img[align="right"] {
      padding-left: 20px;
    }

    img[align="left"] {
      padding-right: 20px;
    }

    .emoji {
      max-width: none;
      vertical-align: text-top;
      background: transparent;
    }

    span.frame {
      display: block;
      overflow: hidden;
    }

    span.frame > span {
      display: block;
      float: left;
      width: auto;
      padding: 7px;
      margin: 13px 0 0;
      overflow: hidden;
      border: 1px solid var(--color-border-default);
    }

    span.frame span img {
      display: block;
      float: left;
    }

    span.frame span span {
      display: block;
      padding: 5px 0 0;
      clear: both;
      color: var(--color-fg-default);
    }

    span.align-center {
      display: block;
      overflow: hidden;
      clear: both;
    }

    span.align-center > span {
      display: block;
      margin: 13px auto 0;
      overflow: hidden;
      text-align: center;
    }

    span.align-center span img {
      margin: 0 auto;
      text-align: center;
    }

    span.align-right {
      display: block;
      overflow: hidden;
      clear: both;
    }

    span.align-right > span {
      display: block;
      margin: 13px 0 0;
      overflow: hidden;
      text-align: right;
    }

    span.align-right span img {
      margin: 0;
      text-align: right;
    }

    span.float-left {
      display: block;
      float: left;
      margin-right: 13px;
      overflow: hidden;
    }

    span.float-left span {
      margin: 13px 0 0;
    }

    span.float-right {
      display: block;
      float: right;
      margin-left: 13px;
      overflow: hidden;
    }

    span.float-right > span {
      display: block;
      margin: 13px auto 0;
      overflow: hidden;
      text-align: right;
    }

    code,
    tt {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background: var(--color-neutral-muted);
      border-radius: var(--border-radius);
    }

    code br,
    tt br {
      display: none;
    }

    del code {
      text-decoration: inherit;
    }

    pre code {
      font-size: 100%;
    }

    pre > code {
      padding: 0;
      margin: 0;
      word-break: normal;
      white-space: pre;
      background: transparent;
      border: 0;
    }

    .highlight {
      margin-bottom: 16px;
    }

    .highlight pre {
      margin-bottom: 0;
      word-break: normal;
    }

    .highlight pre,
    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
    }

    pre code,
    pre tt {
      display: inline;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      border: 0;
      font-family: inherit;
      font-size: inherit;
    }

    .csv-data td,
    .csv-data th {
      padding: 5px;
      overflow: hidden;
      font-size: 12px;
      line-height: 1;
      text-align: left;
      white-space: nowrap;
    }

    .csv-data .blob-num {
      padding: 10px 8px 9px;
      text-align: right;
      background: var(--color-canvas-default);
      border: 0;
    }

    .csv-data tr {
      border-top: 0;
    }

    .csv-data th {
      font-weight: 600;
      background: var(--color-canvas-subtle);
      border-top: 0;
    }

    .footnotes {
      font-size: 12px;
      color: var(--color-fg-muted);
      border-top: 1px solid var(--color-border-default);
    }

    .footnotes ol {
      padding-left: 16px;
    }

    .footnotes li {
      position: relative;
    }

    .footnotes li:target::before {
      position: absolute;
      top: -8px;
      right: -8px;
      bottom: -8px;
      left: -24px;
      pointer-events: none;
      content: "";
      border: 2px solid var(--color-accent-emphasis);
      border-radius: var(--border-radius);
    }

    .footnotes li:target {
      color: var(--color-fg-default);
    }

    .footnotes .data-footnote-backref g-emoji {
      font-family: monospace;
    }

    .task-list-item {
      list-style-type: none;
    }

    .task-list-item label {
      font-weight: 400;
    }

    .task-list-item.enabled label {
      cursor: pointer;
    }

    .task-list-item + .task-list-item {
      margin-top: 3px;
    }

    .task-list-item .handle {
      display: none;
    }

    .task-list-item-checkbox {
      margin: 0 0.2em 0.25em -1.6em;
      vertical-align: middle;
    }

    .contains-task-list:dir(rtl) .task-list-item-checkbox {
      margin: 0 -1.6em 0.25em 0.2em;
    }

    ::-webkit-calendar-picker-indicator {
      filter: invert(50%);
    }

    /* Custom */
    height: fit-content;
  `}
`;

export default Markdown;
