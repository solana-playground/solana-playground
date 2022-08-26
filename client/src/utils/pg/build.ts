import { Idl } from "@project-serum/anchor";

import { SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { Files, PgExplorer, TupleString } from "./explorer";
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

    const rustFiles = pythonFiles.map((file) => {
      const [path, content] = file;
      const seahorseProgramName =
        PgExplorer.getItemNameFromPath(path).split(".py")[0];
      const libRsFilePath = path.replace(`${seahorseProgramName}.py`, "lib.rs");
      let newContent = compileFn(content, seahorseProgramName);

      // The build server detects #[program] to determine if Anchor
      // Seahorse (without rustfmt) outputs # [program]
      newContent = newContent.replace("# [program]", "#[program]");

      if (newContent.length === 0) {
        throw new Error("Seahorse compile failed");
      }

      return [libRsFilePath, newContent] as TupleString;
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

    const result = await PgCommon.checkForRespErr(resp.clone());
    if (result?.err) throw new Error(result.err);

    const data: BuildResp = await resp.json();

    // Update programInfo localStorage
    PgProgramInfo.update({
      uuid: data.uuid ?? undefined,
      idl: data.idl,
    });

    return { stderr: data.stderr };
  }
}
