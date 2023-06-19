import { createCmd } from "../create-command";
import { PgPackage } from "../package";
import { PgTerminal } from "../../terminal";
import { Files, PgExplorer } from "../../explorer";
import { PgProgramInfo } from "../../program-info";
import { PgServer } from "../../server";
import { TerminalAction } from "../../../../state";

export const build = createCmd({
  name: "build",
  description: "Build your program",
  run: async () => {
    PgTerminal.setTerminalState(TerminalAction.buildLoadingStart);
    PgTerminal.log(PgTerminal.info("Building..."));

    let msg;
    try {
      const result = await processBuild();
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
const processBuild = async () => {
  const buildFiles = PgExplorer.getBuildFiles();
  const pythonFiles = buildFiles.filter(([fileName]) =>
    fileName.toLowerCase().endsWith(".py")
  );

  if (pythonFiles.length > 0) {
    return await buildPython(pythonFiles);
  }

  return await buildRust(buildFiles);
};

/**
 * Build rust files and return the output.
 *
 * @param files Rust files from `src/`
 * @returns Build output from stderr(not only errors)
 */
const buildRust = async (files: Files) => {
  if (!files.length) throw new Error("Couldn't find any Rust files.");

  const data = await PgServer.build(files, PgProgramInfo.uuid);

  // Update program info
  PgProgramInfo.update({
    uuid: data.uuid ?? undefined,
    idl: data.idl,
  });

  return { stderr: data.stderr };
};

/**
 * Convert Python files into Rust with seahorse-compile-wasm and run `_buildRust`.
 *
 * @param pythonFiles Python files in `src/`
 * @returns Build output from stderr(not only errors)
 */
const buildPython = async (pythonFiles: Files) => {
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
};
