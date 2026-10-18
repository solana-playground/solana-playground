import {
  convertToPlaygroundCommon,
  getProgramNames,
  selectProgram,
} from "../common";
import type { TupleFiles } from "../../utils";

export const convertToPlayground = async (files: TupleFiles) => {
  const programNames = await getProgramNames(files);
  if (programNames.length > 1) {
    const programName = await selectProgram(programNames);

    // Filter out other programs
    files = files.filter(([path]) => path.includes(programName));
  }

  return convertToPlaygroundCommon(files);
};
