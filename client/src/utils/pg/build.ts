import { Idl } from "@project-serum/anchor";

import { SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { BuildFiles } from "./explorer";
import { PgProgramInfo } from "./program-info";
import { Pkgs } from "./terminal";

interface BuildResp {
  stderr: string;
  uuid: string | null;
  idl: Idl | null;
}

export class PgBuild {
  static async buildPython(pythonFiles: BuildFiles, seahorsePkg: Pkgs) {
    const compileFn = seahorsePkg.compileSeahorse;
    if (!compileFn) {
      throw new Error("No compile function found in seahorse package");
    }

    const rustFiles = pythonFiles.map((file) => {
      const [fileName, content] = file;
      const newFileName = fileName.replace(".py", ".rs");
      let newContent = compileFn(content, "seahorse");

      // The build server detects #[program] to determine if Anchor
      // Seahorse (without rustfmt) outputs # [program]
      newContent = newContent.replace("# [program]", "#[program]");

      if (newContent.length === 0) {
        throw new Error("Seahorse compile failed");
      }

      return [newFileName, newContent];
    });

    return await this.buildRust(rustFiles);
  }

  static async buildRust(rustFiles: BuildFiles) {
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
