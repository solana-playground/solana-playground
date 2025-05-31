import { PgCommon, PgExplorer, TupleFiles } from "../../utils/pg";
import { convertFromPlayground as convertToAnchor } from "../anchor/from";
import { addAfter } from "../common";

/**
 * {@link Framework.importFromPlayground}
 */
export const convertFromPlayground = async (files: TupleFiles) => {
  // Seahorse program name comes from the file name
  const programName = files
    .find(([path]) => /^src.*\.py$/.test(path))?.[0]
    .replace(/src\/(.*)\.py$/, (_, programName) => programName)
    .replace(/.*/, PgCommon.toSnakeCase);
  if (!programName) throw new Error("Program file not found");

  // Seahorse's layout is the same as Anchor's layout with a couple of small
  // differences. Mimic what Seahorse generates by adding a dummy Anchor program
  // with the expected program name as the program module name so that we can
  // convert the files to Anchor to avoid duplicating file generation logic.
  files.push([
    PgCommon.joinPaths(PgExplorer.PATHS.SRC_DIRNAME, "lib.rs"),
    `use anchor_lang::prelude::*;\n#[program] mod ${programName} {}`,
  ]);

  const anchorFiles = await convertToAnchor(files);
  const frameworkFiles = anchorFiles.map((file) => {
    // programs/<program-name>/src/**/*.py -> programs_py/<program-name>.py
    file[0] = file[0].replace(/programs\/.*\/src\/(.*\.py)/, (_, name) => {
      return PgCommon.joinPaths("programs_py", name);
    });

    // Update manifest dependencies
    if (/programs\/.*Cargo\.toml/.test(file[0])) {
      file[1] = addAfter(
        file[1],
        /anchor-lang.*/,
        [
          `anchor-spl = "*"`,
          `pyth-sdk-solana = { version = "*", optional = true }`,
        ].join("\n")
      );
    }

    return file;
  });

  // Add Seahorse prelude
  const SEAHORSE_PATH = PgCommon.joinPaths("programs_py", "seahorse");
  frameworkFiles.push(
    [PgCommon.joinPaths(SEAHORSE_PATH, "__init__.py"), ""],
    [
      PgCommon.joinPaths(SEAHORSE_PATH, "prelude.py"),
      await PgCommon.fetchText(
        "https://raw.githubusercontent.com/solana-developers/seahorse/main/data/const/seahorse_prelude.py"
      ),
    ]
  );

  return frameworkFiles;
};
