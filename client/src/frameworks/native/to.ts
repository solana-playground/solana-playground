import { convertToPlaygroundCommon, selectProgram } from "../common";
import type { TupleFiles } from "../../utils/pg";

/**
 * {@link Framework.importToPlayground}
 */
export const convertToPlayground = async (files: TupleFiles) => {
  // Get Cargo workspace if it exists
  const workspaceManifest = files
    .filter(([path, content]) => {
      return path.endsWith("Cargo.toml") && content.includes("[workspace]");
    })
    .map((file) => [...file, file[0].split("/").length] as const)
    .sort((a, b) => a[2] - b[2])
    .at(0);

  // Cargo workspace
  const programNames: string[] = [];
  if (workspaceManifest) {
    const membersResult = /\[workspace\]members\s+=\s+(\[.*?\])/.exec(
      workspaceManifest[1].replaceAll("\n", "")
    );
    if (membersResult) {
      const members: string[] = JSON.parse(membersResult[1].replace(",]", "]"));

      // Get only the program members and exclude the rest, e.g. examples, macros, tests...
      const programMembers = members.filter((member) => {
        return files
          .filter(([path]) => path.includes(member))
          .some(([_, content]) => content.includes("entrypoint!"));
      });
      programNames.push(...programMembers);
    }
  }

  // Handle multiple programs
  if (programNames.length > 1) {
    // Select the program
    const programName = await selectProgram(programNames);

    // Filter out other programs
    files = files.filter(([path]) => path.includes(programName));
  }

  return convertToPlaygroundCommon(files);
};
