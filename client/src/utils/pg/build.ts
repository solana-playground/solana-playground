import { Idl } from "@project-serum/anchor";

import { SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { Files, PgExplorer } from "./explorer";
import { PgProgramInfo } from "./program-info";
import { PgPkg } from "./terminal";

interface BuildResp {
  stderr: string;
  uuid: string | null;
  idl: Idl | null;
}

export class PgBuild {
  /**
   * Compile the current project
   *
   * @returns Build output from stderr(not only errors)
   */
  static async build() {
    const buildFiles = await PgExplorer.run({ getBuildFiles: [] });
    const pythonFiles = buildFiles.filter(([fileName]) =>
      fileName.toLowerCase().endsWith(".py")
    );

    let result;
    if (pythonFiles.length > 0) {
      result = await PgBuild._buildPython(pythonFiles);
    } else {
      result = await PgBuild._buildRust(buildFiles);
    }

    return result;
  }

  /**
   * Convert Python files into Rust with seahorse-compile-wasm and run `_buildRust`
   *
   * @param pythonFiles Python files in `src/`
   * @returns Build output from stderr(not only errors)
   */
  private static async _buildPython(pythonFiles: Files) {
    const { compileSeahorse } = await PgPkg.loadPkg(PgPkg.SEAHORSE_COMPILE);
    if (!compileSeahorse) {
      throw new Error("No compile function found in Seahorse package");
    }

    const rustFiles = pythonFiles.flatMap((file) => {
      const [path, content] = file;
      const seahorseProgramName =
        PgExplorer.getItemNameFromPath(path).split(".py")[0];
      let compiledContent = compileSeahorse(content, seahorseProgramName);

      if (compiledContent.length === 0) {
        throw new Error("Seahorse compile failed");
      }

      // Seahorse compile outputs a flattened array like [filepath, content, filepath, content]
      const files: Files = [];
      for (let i = 0; i < compiledContent.length; i += 2) {
        const path = compiledContent[i];
        let content = compiledContent[i + 1];
        // The build server detects #[program] to determine if Anchor
        // Seahorse (without rustfmt) outputs # [program]
        content = content.replace("# [program]", "#[program]");
        files.push([path, content]);
      }

      return files;
    });

    return await this._buildRust(rustFiles);
  }

  /**
   * Build rust files and return the output
   *
   * @param rustFiles Rust files from `src/`
   * @returns Build output from stderr(not only errors)
   */
  private static async _buildRust(rustFiles: Files) {
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
