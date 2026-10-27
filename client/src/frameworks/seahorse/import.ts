import { PgCommon, PgExplorer, PgFramework, TupleFiles } from "../../utils";

export const convertToPlayground = async (files: TupleFiles) => {
  // Seahorse is a wrapper around Anchor, only difference is the Python files.
  // We convert to Anchor files and replace the Rust files with Python.
  const framework = PgFramework.get("Anchor");
  const { convertToPlayground: convertFromAnchor } = await framework.import();
  const anchorFiles = await convertFromAnchor(files);
  const seahorseFiles = anchorFiles
    .filter(([path]) => !path.endsWith(".rs"))
    .concat(
      files.reduce((acc, file) => {
        const result = /.*programs_py\/([\w\d]+\.py)/.exec(file[0]);
        if (result) {
          file[0] = PgCommon.joinPaths(PgExplorer.PATHS.SRC_DIRNAME, result[1]);
          acc.push(file);
        }

        return acc;
      }, [] as TupleFiles)
    );

  return seahorseFiles;
};
