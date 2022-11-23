import { Idl } from "@project-serum/anchor";

import { SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { Files, PgExplorer } from "./explorer";
import { PgProgramInfo } from "./program-info";
import { Pkgs } from "./terminal";

interface BuildResp {
  stderr: string;
  uuid: string | null;
  idl: Idl | null;
}

export class PgBuild {
  /**
   * Convert python files into rust with seahorse-compile-wasm and run `buildRust`
   *
   * @param pythonFiles Python files in `src/`
   * @param seahorsePkg Loaded `seahorse-compile-wasm` package
   * @returns Build output from stderr(not only errors)
   */
  static async buildPython(pythonFiles: Files, seahorsePkg: Pkgs) {
    const compileFn = seahorsePkg.compileSeahorse;
    if (!compileFn) {
      throw new Error("No compile function found in seahorse package");
    }

    const rustFiles = pythonFiles.flatMap((file) => {
      const [path, content] = file;
      const seahorseProgramName =
        PgExplorer.getItemNameFromPath(path).split(".py")[0];
      let newContent = compileFn(content, seahorseProgramName);

      if (newContent.length === 0) {
        throw new Error("Seahorse compile failed");
      }

      // seahorse compile outputs a flattened array like [filepath, content, filepath, content]
      const files: Files = [];
      for (let i = 0; i < newContent.length; i += 2) {
        const path = newContent[i];
        let content = newContent[i + 1];
        // The build server detects #[program] to determine if Anchor
        // Seahorse (without rustfmt) outputs # [program]
        content = content.replace("# [program]", "#[program]");
        files.push([path, content]);
      }

      return files;
    });

    return await this.buildRust(rustFiles);
  }

  /**
   * Build rust files and return the output
   *
   * @param rustFiles Rust files from `src/`
   * @returns Build output from stderr(not only errors)
   */
  static async buildRust(rustFiles: Files) {
    if (!rustFiles.length) throw new Error("Couldn't find any Rust files.");

    const programInfo = PgProgramInfo.getProgramInfo();

    const resp = await fetch(`${SERVER_URL}/build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: rustFiles,
        uuid: programInfo.uuid,
      }),
    });

    await PgCommon.checkForRespErr(resp.clone());

    const data: BuildResp = await resp.json();

    // Update programInfo localStorage
    PgProgramInfo.update({
      uuid: data.uuid ?? undefined,
      idl: data.idl,
    });

    return { stderr: data.stderr };
  }
}
