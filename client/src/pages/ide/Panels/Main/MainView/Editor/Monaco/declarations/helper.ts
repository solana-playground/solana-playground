import type { ClientPackageName } from "../../../../../../../../utils/pg";

/**
 * Some declaration files need to be declared for them to be referenced by other
 * declaration files.
 *
 * @param packageName package name to be referenced in declaration files
 * @param module contents of the module
 * @returns module declaration for the given package
 */
export const declareModule = (
  packageName: ClientPackageName,
  module: string = ""
) => {
  return `declare module "${packageName}" { ${module} }`;
};
