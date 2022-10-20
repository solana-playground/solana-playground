import { ComponentType } from "react";

export interface TutorialData {
  /** Tutorial name that will be shown in tutorials section */
  name: string;
  /** Tutorial description that will be shown in tutorials section */
  description: string;
  /** Tutorial cover image that will be shwon in tutorials section */
  imageSrc: string;
  /** Tutorial component async import */
  elementImport: () => Promise<{ default: TutorialElement }>;
}

export type TutorialElement = ComponentType<TutorialProps>;

export type TutorialProps = Omit<TutorialData, "elementImport">;

export type TutorialComponentProps = TutorialProps & {
  main: string;
  pages: string[];
};
