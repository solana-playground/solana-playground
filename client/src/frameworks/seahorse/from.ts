import { PgCommon, TupleFiles } from "../../utils/pg";
import { convertFromPlayground as convertToAnchor } from "../anchor/from";

/**
 * {@link Framework.importFromPlayground}
 */
export const convertFromPlayground = (files: TupleFiles) => {
  // Seahorse program name comes from the file name
  const programName = files
    .find(([path]) => /^src.*\.py$/.test(path))?.[0]
    .replace(/src\/(.*)\.py$/, (_, programName) => programName);
  if (!programName) throw new Error("Program file not found");

  // Seahorse's layout is the same as Anchor's layout with a couple of small
  // differences. Mimic what Seahorse generates by adding a dummy Anchor program
  // with the expected program name as the program module name so that we can
  // convert the files to Anchor to avoid duplicating file generation logic.
  files.push([
    PgCommon.joinPaths(["src", "lib.rs"]),
    `use anchor_lang::prelude::*;\n#[program] mod ${programName} {}`,
  ]);

  return convertToAnchor(files).map((file) => {
    // programs/<program-name>/src/**/*.py -> programs_py/<program-name>.py
    file[0] = file[0].replace(/programs\/.*\/src\/(.*\.py)/, (_, name) => {
      return PgCommon.joinPaths(["programs_py", name]);
    });

    return file;
  });
};
