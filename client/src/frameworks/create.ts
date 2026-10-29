import {
  Arrayable,
  Framework,
  FrameworkParam,
  PgCommon,
  PgTemplate,
  TupleFiles,
} from "../utils";

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

  framework.versions ??= TEMPLATES.filter((t) => t.startsWith(kebabName)).map(
    (t) => t.replace(kebabName + "-", "")
  );

  if (framework.legacy) {
    // The `legacy` template is named differently and supports multiple frameworks
    // at the same time. If a framework has its `legacy.version` field set,
    // assume it's a real version that uses the `legacy` template and prepend it
    // to the existing versions.
    if (framework.legacy.version) {
      framework.versions.unshift(framework.legacy.version);
    }

    framework.legacy.getFiles ??= () => import(dirPath + "files");
  }

  framework.getTemplateFiles ??= async (version) => {
    if (version === framework.legacy?.version) {
      const { files: playgroundFiles } = await framework.legacy.getFiles!();
      const { convertFromPlayground } = await framework.export!();
      return await convertFromPlayground(playgroundFiles);
    }

    return await PgTemplate.getFiles(`${kebabName}-${version}`);
  };

  framework.import ??= async () => {
    try {
      return await import(dirPath + "import");
    } catch {
      const { convertToPlaygroundCommon } = await import("./common");
      return { convertToPlayground: convertToPlaygroundCommon };
    }
  };
  framework.export ??= async () => {
    const { convertFromPlayground } = await import(dirPath + "export");
    const readme = await import(dirPath + "export.md")
      .then((mod) => mod.default)
      .catch(() => {});
    return { convertFromPlayground, readme };
  };

  return framework as Framework<N>;
};

// NOTE: This exists here instead of in `./common` because `./common` gets
// lazy-loaded on-demand.
/**
 * Decide whether the files belong to the current framework.
 *
 * @param files files to check (playground or original layout)
 * @param pathEndsWith only check files that ends with this suffix
 * @param contentIncludes check the content includes these values
 * @returns
 */
export const getIsCurrentCommon = (
  files: TupleFiles,
  pathEndsWith: string,
  contentIncludes: Arrayable<string>
) => {
  for (const [path, content] of files) {
    if (!path.endsWith(pathEndsWith)) continue;

    const isCurrent = PgCommon.toArray(contentIncludes).every(
      (contentInclude) => content.includes(contentInclude)
    );
    if (isCurrent) return true;
  }

  return false;
};
