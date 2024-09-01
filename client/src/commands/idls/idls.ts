import { PgCommon, PgExplorer, PgTerminal } from "../../utils/pg";
import { createCmd } from "../create";

// Folder for external program IDLS to use with declare_program() macro
export const idls = createCmd({
  name: "idls",
  description: "Create IDLs Folder",
  run: async () => {
    const folderPath = PgExplorer.PATHS.IDLS_DIRNAME;
    const folder = PgExplorer.getFolderContent(folderPath);

    // Create default  if the folder is empty
    if (!folder.files.length && !folder.folders.length) {
      let DEFAULT;

      PgTerminal.log(
        PgTerminal.info("Creating folder for External Program IDLs...")
      );
      DEFAULT = DEFAULT_IDL;

      const [fileName, code] = DEFAULT;
      await PgExplorer.newItem(PgCommon.joinPaths(folderPath, fileName), code);
    }
  },
});

/** Default .json file */
const DEFAULT_IDL = ["idl.json", ``];
