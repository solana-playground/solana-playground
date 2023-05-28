import type { Idl } from "@project-serum/anchor";

import { createCmd } from "../create-command";
import { PgPackage } from "../package";
import { PgCommon } from "../../common";
import { PgTerminal } from "../../terminal";
import { Files, PgExplorer } from "../../explorer";
import { PgProgramInfo } from "../../program-info";
import { TerminalAction } from "../../../../state";
import { SERVER_URL } from "../../../../constants";

export const build = createCmd({
  name: "build",
  description: "Build your program",
  run: async () => {
    PgTerminal.setTerminalState(TerminalAction.buildLoadingStart);
    PgTerminal.log(PgTerminal.info("Building..."));

    let msg;
    try {
      const result = await buildInternal();
      msg = PgTerminal.editStderr(result.stderr);
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Build error: ${convertedError}`;
    } finally {
      PgTerminal.log(msg + "\n");
      PgTerminal.setTerminalState(TerminalAction.buildLoadingStop);
    }
  },
});

/**
 * Compile the current project.
 *
 * @returns build output from stderr(not only errors)
 */
async function buildInternal() {
  const buildFiles = await PgExplorer.run({ getBuildFiles: [] });
  const pythonFiles = buildFiles.filter(([fileName]) =>
    fileName.toLowerCase().endsWith(".py")
  );

  if (pythonFiles.length > 0) {
    return await buildPython(pythonFiles);
  }

  return await buildRust(buildFiles);
}

/**
 * Build rust files and return the output.
 *
 * @param rustFiles Rust files from `src/`
 * @returns Build output from stderr(not only errors)
 */
async function buildRust(rustFiles: Files) {
  if (!rustFiles.length) throw new Error("Couldn't find any Rust files.");

  const resp = await fetch(`${SERVER_URL}/build`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: rustFiles,
      uuid: PgProgramInfo.uuid,
    }),
  });

  await PgCommon.checkForRespErr(resp.clone());

  interface BuildResponse {
    stderr: string;
    uuid: string | null;
    idl: Idl | null;
  }

  const data: BuildResponse = await resp.json();

  // Update program info
  PgProgramInfo.update({
    uuid: data.uuid ?? undefined,
    idl: data.idl,
  });

  return { stderr: data.stderr };
}

/**
 * Convert Python files into Rust with seahorse-compile-wasm and run `_buildRust`.
 *
 * @param pythonFiles Python files in `src/`
 * @returns Build output from stderr(not only errors)
 */
async function buildPython(pythonFiles: Files) {
  const { compileSeahorse } = await PgPackage.import("seahorse-compile");

  const rustFiles = pythonFiles.flatMap(([path, content]) => {
    const seahorseProgramName =
      PgExplorer.getItemNameFromPath(path).split(".py")[0];
    const compiledContent = compileSeahorse(content, seahorseProgramName);

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

  return await buildRust(rustFiles);
}
