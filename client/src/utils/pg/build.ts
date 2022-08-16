import { Idl } from "@project-serum/anchor";

import { SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { PgProgramInfo } from "./program-info";
import { PgPkg, PkgName } from "./terminal";

interface BuildResp {
  stderr: string;
  uuid: string | null;
  idl: Idl | null;
}

export type Files = string[][];

export class PgBuild {
  static getProgramName(fileName: string, expectedSuffix: string) {
    const pathParts = fileName.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart.replace(expectedSuffix, "");
  }

  static async build(files: Files) {
    const programInfo = PgProgramInfo.getProgramInfo();

    const pythonFiles = files.filter(([fileName]) =>
      fileName.toLowerCase().endsWith(".py")
    );

    let rustFiles: Files;
    if (pythonFiles.length > 0) {
      const seahorsePkg = await PgPkg.loadPkg(PkgName.SEAHORSE_COMPILE);
      const compileFn = seahorsePkg.compileSeahorse;
      if (!compileFn) {
        throw new Error("No compile function found in seahorse package");
      }

      rustFiles = files.map((file) => {
        const [fileName, contents] = file;
        const newFileName = fileName.replace(".py", ".rs");
        const programName = this.getProgramName(fileName, ".py");
        const newContents = compileFn(contents, programName);
        if (newContents.length === 0) {
          throw new Error("Seahorse compile failed");
        }

        return [newFileName, newContents];
      });
    } else {
      rustFiles = files;
    }

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
