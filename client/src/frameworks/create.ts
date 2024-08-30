import { Framework, FrameworkImpl, PgCommon } from "../utils/pg";

/**
 * Create a framework with inferred types.
 *
 * @param framework framework to create
 * @returns the framework with inferred types
 */
export const createFramework = <N extends string>(
  framework: FrameworkImpl<N>
) => {
  const folderPath = `./${PgCommon.toKebabFromTitle(framework.name)}/`;
  framework.importFiles ??= () => import(folderPath + "files");
  framework.importFromPlayground ??= async () => {
    const { convertFromPlayground } = await import(folderPath + "from");
    const { default: readme } = await import(folderPath + "from.md");
    return { convertFromPlayground, readme };
  };
  framework.importToPlayground ??= () => import(folderPath + "to");

  return framework as Framework<N>;
};
