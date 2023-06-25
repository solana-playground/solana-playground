import type { TupleFiles } from "../../utils/pg";

export type TutorialComponentProps = {
  /** About section that will be shown under the description of the tutorial page */
  about: TutorialElement;
  /* Tutorial pages to show next to the editor */
  pages: Page[];
  /** Initial files to have at the beginning of the tutorial */
  files: TupleFiles;
  /** Initial open file when the tutorial/page is first loaded */
  defaultOpenFile?: string;
  /** Whether to put editor to the right instead of left */
  rtl?: boolean;
  /** Callback to run when the tutorial is completed */
  onComplete?: () => any;
} & Pick<Page, "onMount">;

export type TutorialAboutComponentProps = Pick<
  TutorialComponentProps,
  "about" | "files" | "defaultOpenFile" | "pages"
>;

export type TutorialMainComponentProps = Pick<
  TutorialComponentProps,
  "pages" | "rtl" | "onComplete"
>;

type Page = {
  /** Content of the page, can be either:
   * - Text string(Markdown supported)
   * - React component
   */
  content: TutorialElement;
  /** Title of the page that will be used for navigation.
   *
   * Defaults to `pageNumber/pageCount`, e.g. 3/5
   */
  title?: string;
  /** Callback to run on mount */
  onMount?: () => any;
};

/** String or JSX */
type TutorialElement = string | JSX.Element;
