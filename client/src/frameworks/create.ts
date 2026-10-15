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
  const dirPath = `./${kebabName}/`;
  framework.icon ??= `/frameworks/${kebabName}/icon.png`;

  // TODO: Include the `legacy` template. It is named differently and supports
  // multiple frameworks at the same time.
  framework.versions ??= TEMPLATES.filter((t) => t.startsWith(kebabName)).map(
    (t) => t.replace(kebabName + "-", "")
  );
  if (framework.legacy) {
    framework.versions.push(framework.legacy.version);
    framework.legacy.getFiles ??= () => import(dirPath + "files");
  }

  framework.getTemplateFiles ??= async (version) => {
    if (version === framework.legacy?.version) {
      const { files: playgroundFiles } = await framework.legacy.getFiles!();
      const { convertFromPlayground } = await framework.export!();
      return await convertFromPlayground(playgroundFiles);
    }

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

  framework.import ??= () => import(dirPath + "import");
  framework.export ??= async () => {
    const { convertFromPlayground } = await import(dirPath + "export");
    const { default: readme } = await import(dirPath + "export.md");
    return { convertFromPlayground, readme };
  };

  return framework as Framework<N>;
};
