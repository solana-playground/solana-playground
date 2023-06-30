import { Keypair } from "@solana/web3.js";

import { createCmd } from "../create-command";
import { PgPackage } from "../package";
import { TupleFiles, PgExplorer, ExplorerFiles } from "../../explorer";
import { PgProgramInfo } from "../../program-info";
import { PgServer } from "../../server";
import { PgTerminal } from "../../terminal";
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
  const buildFiles = getBuildFiles();
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
const buildRust = async (files: TupleFiles) => {
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
const buildPython = async (pythonFiles: TupleFiles) => {
  const { compileSeahorse } = await PgPackage.import("seahorse-compile");

  const rustFiles = pythonFiles.flatMap(([path, content]) => {
    const seahorseProgramName =
      PgExplorer.getItemNameFromPath(path).split(".py")[0];
    const compiledContent = compileSeahorse(content, seahorseProgramName);

    if (compiledContent.length === 0) {
      throw new Error("Seahorse compile failed");
    }

    // Seahorse compile outputs a flattened array like [filepath, content, filepath, content]
    const files: TupleFiles = [];
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

/**
 * Get the files necessary for the build process.
 *
 * @returns the necessary data for the build request
 */
const getBuildFiles = () => {
  let programPkStr = PgProgramInfo.getPkStr();
  if (!programPkStr) {
    const kp = Keypair.generate();
    PgProgramInfo.update({ kp });
    programPkStr = kp.publicKey.toBase58();
  }

  const updateIdRust = (content: string) => {
    let updated = false;

    const rustDeclareIdRegex = new RegExp(
      /^(([\w]+::)*)declare_id!\("(\w*)"\)/gm
    );
    const newContent = content.replace(rustDeclareIdRegex, (match) => {
      const res = rustDeclareIdRegex.exec(match);
      if (!res) return match;
      updated = true;

      // res[1] could be solana_program:: or undefined
      return (res[1] ?? "\n") + `declare_id!("${programPkStr}")`;
    });

    return {
      content: newContent,
      updated,
    };
  };

  const updateIdPython = (content: string) => {
    let updated = false;

    const pythonDeclareIdRegex = new RegExp(/^declare_id\(("|')(\w*)("|')\)/gm);

    const newContent = content.replace(pythonDeclareIdRegex, (match) => {
      const res = pythonDeclareIdRegex.exec(match);
      if (!res) return match;
      updated = true;
      return `declare_id('${programPkStr}')`;
    });

    return {
      content: newContent,
      updated,
    };
  };

  const getUpdatedProgramIdContent = (path: string) => {
    let content = files[path].content;
    let updated = false;
    if (content) {
      if (path.endsWith(".rs")) {
        const updateIdResult = updateIdRust(content);
        content = updateIdResult.content;
        updated = updateIdResult.updated;
      } else if (path.endsWith(".py")) {
        const updateIdResult = updateIdPython(content);
        content = updateIdResult.content;
        updated = updateIdResult.updated;
      }
    }

    return { content, updated };
  };

  // Prioritise files where we are likely to find a rust `declare_id!`
  const prioritiseFilePaths = (files: ExplorerFiles) => {
    const prioritised: Array<string> = [];
    for (const path in files) {
      if (path.endsWith("lib.rs") || path.endsWith("id.rs")) {
        prioritised.unshift(path);
      } else {
        prioritised.push(path);
      }
    }
    return prioritised;
  };

  const files = PgExplorer.files;
  const prioritisedFilePaths = prioritiseFilePaths(files);
  const buildFiles: TupleFiles = [];

  let alreadyUpdatedId = false;
  if (PgExplorer.isTemporary) {
    for (const path of prioritisedFilePaths) {
      let content;
      // Shared files are already in correct format, we only update program id
      if (!alreadyUpdatedId) {
        const updateIdResult = getUpdatedProgramIdContent(path);
        content = updateIdResult.content;
        alreadyUpdatedId = updateIdResult.updated;
      } else {
        content = files[path].content;
      }
      if (!content) continue;
      buildFiles.push([path, content]);
    }
  } else {
    for (let path of prioritisedFilePaths) {
      if (!path.startsWith(PgExplorer.getCurrentSrcPath())) continue;

      let content = files[path].content;
      if (!alreadyUpdatedId) {
        const updateIdResult = getUpdatedProgramIdContent(path);
        content = updateIdResult.content;
        alreadyUpdatedId = updateIdResult.updated;
      }
      if (!content) continue;

      // Remove the workspace from path because build only needs /src
      path = path.replace(
        PgExplorer.currentWorkspacePath,
        PgExplorer.PATHS.ROOT_DIR_PATH
      );

      buildFiles.push([path, content]);
    }
  }

  return buildFiles;
};
