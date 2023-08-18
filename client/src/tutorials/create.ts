import { PgCommon, TutorialData, TutorialDataInit } from "../utils/pg";

/** Create tutorials with defaults. */
export const createTutorials = (...tutorials: TutorialDataInit[]) => {
  return tutorials.map((tutorial) => {
    if (!tutorial.thumbnail) {
      const kebabCaseName = PgCommon.toKebabFromTitle(tutorial.name);
      tutorial.thumbnail =
        kebabCaseName + "/" + TUTORIAL_THUMBNAIL_MAP[kebabCaseName];
    }
    tutorial.thumbnail = "/tutorials/" + tutorial.thumbnail;

    tutorial.elementImport ??= () => {
      return import(`./${PgCommon.toPascalFromTitle(tutorial.name)}`);
    };

    return tutorial;
  }) as TutorialData[];
};
