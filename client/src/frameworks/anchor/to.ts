import { PgCommon, TupleFiles } from "../../utils/pg";
import { convertToPlaygroundCommon, selectProgram } from "../common";

/**
 * {@link Framework.importToPlayground}
 */
export const convertToPlayground = async (files: TupleFiles) => {
  // Get program name(s)
  const programNames = PgCommon.toUniqueArray(
    files
      .map(([path]) => /programs\/(.*?)\/src/.exec(path)?.[1])
      .filter(PgCommon.isNonNullish)
  );

  // Handle multiple programs
  if (programNames.length > 1) {
    // Select the program
    const programName = await selectProgram(programNames);

    // Filter out other programs
    files = files.filter(([path]) => {
      if (path.includes("programs")) {
        return path.includes(PgCommon.joinPaths("programs", programName));
      }

      return true;
    });
  }

  return convertToPlaygroundCommon(files);
};
