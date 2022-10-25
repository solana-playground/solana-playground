import { Files } from "../../utils/pg";

type Page = {
  /** Content of the page(markdown) */
  content: string;
  /** Title of the page that will be used for navigation */
  title: string;
} & Pick<TutorialComponentProps, "onMount">;

export type TutorialComponentProps = {
  /** About section that will be shown under the description of the tutorial page */
  about: string;
  /* Tutorial pages to show next to the editor */
  pages: Page[];
  /** Initial files to have at the beginning of the tutorial */
  files: Files;
  /** Initial open file when the tutorial/page is first loaded */
  defaultOpenFile?: string;
  /** Whether to put editor to the right instead of left */
  rtl?: boolean;
  /** Callback to run on mount */
  onMount?: () => any;
};
