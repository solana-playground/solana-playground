import { ComponentType } from "react";

import { Files } from "../../utils/pg";

export interface TutorialData {
  /** Tutorial name that will be shown in tutorials section */
  name: string;
  /** Tutorial description that will be shown in tutorials section */
  description: string;
  /** Tutorial cover image that will be shwon in tutorials section */
  imageSrc: string;
  /** Tutorial component async import */
  elementImport: () => Promise<{
    default: ComponentType<Omit<TutorialData, "elementImport">>;
  }>;
}

type Page = {
  /** Content of the page(markdown) */
  content: string;
  /** Title of the page that will be used for navigation */
  title: string;
};

export type TutorialComponentProps = {
  /** Main markdown text to show as the preview and introduction to the tutorial */
  main: string;
  /* Tutorial pages to show next to the editor */
  pages: Page[];
  /** Initial files to have at the beginning of the tutorial */
  files: Files;
  /** Initial open file when the tutorial is first loaded */
  defaultOpenFile?: string;
  /** Whether to put editor to the right instead of left */
  reverseLayout?: boolean;
};
