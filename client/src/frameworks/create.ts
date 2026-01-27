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
  const folderPath = `./${PgCommon.toKebabFromTitle(framework.name)}/`;
  framework.getDefaultFiles ??= () => import(folderPath + "files");
  framework.import ??= () => import(folderPath + "import");
  framework.export ??= async () => {
    const { convertFromPlayground } = await import(folderPath + "export");
    const { default: readme } = await import(folderPath + "export.md");
    return { convertFromPlayground, readme };
  };

  return framework as Framework<N>;
};
