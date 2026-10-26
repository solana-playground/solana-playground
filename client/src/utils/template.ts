import { PgCommon } from "./common";
import type { TupleFiles } from "./explorer";

export class PgTemplate {
  /**
   * Get all files of the template.
   *
   * NOTE: The files do not have to be in playground layout format.
   *
   * @param name template name
   * @returns template files
   */
  static async getFiles(name: string): Promise<TupleFiles> {
    const templatePath = `/templates/${name}`;
    const paths = await PgCommon.fetchJson<string[]>(
      PgCommon.joinPaths(templatePath, "paths.json")
    );
    const contents = await Promise.all(
      paths
        .map((path) => PgCommon.joinPaths(templatePath, path))
        .map(PgCommon.fetchText)
    );
    return paths.map((path, i) => [path, contents[i]]);
  }
}
