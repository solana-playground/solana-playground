import {
  PgCommon,
  TupleString,
  TutorialData,
  TutorialDataParam,
} from "../utils/pg";

/** Create tutorials with defaults. */
export const createTutorials = (...tutorials: TutorialDataParam[]) => {
  const customTutorials = tutorials.map((tutorial) => {
    setCommonDefaults(tutorial);

    tutorial.importComponent ??= () => {
      return import(`./${PgCommon.toPascalFromTitle(tutorial.name)}`);
    };

    return tutorial;
  });

  const markdownTutorials = MARKDOWN_TUTORIALS.map((tutorial) => {
    setCommonDefaults(tutorial);

    tutorial.importComponent = async () => {
      const tutorialPath = getTutorialPath(tutorial);
      const fetchText = (p: string) => PgCommon.fetchText(tutorialPath + p);

      const info: {
        files: string[];
        pageCount: number;
      } = await PgCommon.fetchJSON(tutorialPath + "content.json");

      const about = await fetchText("about.md");
      const pages = (
        await Promise.all(
          new Array(info.pageCount)
            .fill(null)
            .map((_, i) => `pages/${i + 1}.md`)
            .map(fetchText)
        )
      ).map((content) => ({ content }));
      const files = (
        await Promise.all(
          info.files.map((name) => `files/${name}`).map(fetchText)
        )
      ).map((content, i) => [info.files[i], content] as TupleString);

      const { Tutorial } = await import("../components/Tutorial");
      return {
        default: () => <Tutorial about={about} pages={pages} files={files} />,
      };
    };

    return tutorial;
  });

  return customTutorials.concat(markdownTutorials) as TutorialData[];
};

/** Set common tutorial defaults. */
const setCommonDefaults = (tutorial: TutorialDataParam) => {
  if (tutorial.categories && tutorial.categories.length > 3) {
    throw new Error(
      [
        `Tutorial "${tutorial.name}" has ${tutorial.categories.length}`,
        "categories but the maximum allowed category amount is 3",
      ].join(" ")
    );
  }

  if (!tutorial.thumbnail) {
    const kebabCaseName = PgCommon.toKebabFromTitle(tutorial.name);
    tutorial.thumbnail = TUTORIAL_THUMBNAIL_MAP[kebabCaseName];
  }
  tutorial.thumbnail = getTutorialPath(tutorial) + tutorial.thumbnail;
};

/** Get the public tutorial path with '/' appended. */
const getTutorialPath = (tutorial: TutorialDataParam) => {
  return "/tutorials/" + PgCommon.toKebabFromTitle(tutorial.name) + "/";
};
