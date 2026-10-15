import { Framework, FrameworkParam, PgCommon } from "../utils";

/**
 * Create a framework with inferred types.
 *
 * @param framework framework to create
 * @returns the framework with inferred types
 */
export const createFramework = <N extends string>(
  framework: FrameworkParam<N>
) => {
  const kebabName = PgCommon.toKebabFromTitle(framework.name);
  framework.icon ??= `/frameworks/${kebabName}/icon.png`;

  // TODO: Include the `legacy` template. It is named differently and supports
  // multiple frameworks at the same time.
  framework.versions ??= TEMPLATES.filter((t) => t.startsWith(kebabName)).map(
    (t) => t.replace(kebabName + "-", "")
  );
  framework.getTemplateFiles ??= async (version) => {
    const templatePath = `/templates/${kebabName}-${version}`;
    const paths = await PgCommon.fetchJson<string[]>(
      PgCommon.joinPaths(templatePath, "paths.json")
    );
    const contents = await Promise.all(
      paths
        .map((path) => PgCommon.joinPaths(templatePath, path))
        .map(PgCommon.fetchText)
    );
    return paths.map((path, i) => [path, contents[i]]);
  };

  const folderPath = `./${kebabName}/`;
  framework.getDefaultFiles ??= () => import(folderPath + "files");
  framework.import ??= () => import(folderPath + "import");
  framework.export ??= async () => {
    const { convertFromPlayground } = await import(folderPath + "export");
    const { default: readme } = await import(folderPath + "export.md");
    return { convertFromPlayground, readme };
  };

  return framework as Framework<N>;
};
