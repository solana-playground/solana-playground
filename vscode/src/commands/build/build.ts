import * as vscode from "vscode";
import * as path from "path";
import fetch from "node-fetch";
import { Keypair } from "@solana/web3.js";

import { PATHS, SERVER_URL } from "../../constants";
import {
  Files,
  Framework,
  pgChannel,
  PgCommon,
  PgFs,
  PgProgramInfo,
} from "../../utils";

interface BuildResponse {
  stderr: string;
  uuid: string | null;
  idl: { name: string } | null;
}

export const processBuild = async () => {
  // Create program keypair if it doesn't exist
  const { files, programKpUri, programUri, framework } =
    await PgFs.getProgramData();

  let programKp: Keypair;
  try {
    const programKpStr = await PgFs.readFile(programKpUri);
    programKp = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(programKpStr))
    );
  } catch (e) {
    programKp = Keypair.generate();
    await PgFs.writeFile(
      programKpUri,
      JSON.stringify(Array.from(programKp.secretKey))
    );
  }

  // Change program id in file system
  const rustDeclareIdRegex = /^\s*(([\w_]+::)*)declare_id!\("(\w*)"\)/;
  const pythonDeclareIdRegex = new RegExp(/^declare_id\(("|')(\w*)("|')\)/gm);

  /**
   * Update the `declare_id!` macro in Rust source content with the current
   * program's public key, skipping occurrences inside comments.
   *
   * Uses the same comment-skipping approach as the client build command.
   */
  const updateIdRust = (content: string) => {
    let updated = false;
    let insideBlockComment = false;
    const programPkStr = programKp.publicKey.toBase58();
    const newContent = content
      .split("\n")
      .map((line) => {
        // Track block comment opening
        if (line.includes("/*")) insideBlockComment = true;

        // If inside block comment, skip line entirely
        if (insideBlockComment) {
          // Track block comment closing
          if (line.includes("*/")) insideBlockComment = false;
          return line;
        }

        // Skip single-line comments
        if (line.trimStart().startsWith("//")) return line;

        return line.replace(rustDeclareIdRegex, (match) => {
          const res = rustDeclareIdRegex.exec(match);
          if (!res) return match;
          updated = true;

          // `res[1]` could be `solana_program::` or `undefined`
          return (res[1] ?? "") + `declare_id!("${programPkStr}")`;
        });
      })
      .join("\n");

    return { content: newContent, updated };
  };

  const getDeclareIdFile = () => {
    return files.find((file) => {
      if (file[0].endsWith(PATHS.FILES.LIB_RS)) {
        const { updated } = updateIdRust(file[1]);
        // If updateIdRust would update it, declare_id exists uncommented
        return updated || rustDeclareIdRegex.test(file[1]);
      } else if (file[0].endsWith(".py")) {
        return pythonDeclareIdRegex.test(file[1]);
      }
    });
  };

  const updateId = (file: Files[0]) => {
    const content = file[1];
    if (file[0].endsWith(PATHS.FILES.LIB_RS)) {
      return updateIdRust(content).content;
    } else if (file[0].endsWith(".py")) {
      return content.replace(
        pythonDeclareIdRegex,
        () => `declare_id('${programKp.publicKey.toBase58()}')`
      );
    }
  };

  const declareIdFile = getDeclareIdFile();
  if (declareIdFile) {
    // Update program id
    await PgFs.writeFile(
      framework === Framework.SEAHORSE
        ? programUri
        : vscode.Uri.parse(path.join(programUri.fsPath, declareIdFile[0])),
      updateId(declareIdFile)!
    );
  } else {
    pgChannel.appendLine("Please declare program id with declare_id!");
  }

  // Get the updated build files
  const { files: updatedFiles, baseUri, name } = await PgFs.getProgramData();

  // Seahorse compile
  let seahorseCompiledFiles;
  if (framework === Framework.SEAHORSE) {
    const { compileSeahorse } = await import(
      "@solana-playground/seahorse-compile"
    );

    seahorseCompiledFiles = updatedFiles.flatMap((file) => {
      let compiledContent = compileSeahorse(file[1], name);

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
  }

  // Compile
  const resp = await fetch(`${SERVER_URL}/build`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: seahorseCompiledFiles ?? updatedFiles,
      uuid: PgProgramInfo.get().uuid,
    }),
  });

  await PgCommon.checkForRespErr(resp.clone());

  const data = (await resp.json()) as BuildResponse;

  // Update programInfo
  if (data.uuid) {
    PgProgramInfo.update({
      uuid: data.uuid,
    });
  }

  // Create/update IDL file
  switch (framework) {
    case Framework.NATIVE: {
      // Do nothing
      break;
    }

    case Framework.ANCHOR:
    case Framework.SEAHORSE: {
      if (data.idl?.name) {
        await PgFs.writeFiles(
          [
            [
              path.join(PATHS.DIRS.IDL, `${data.idl.name}.json`),
              JSON.stringify(data.idl),
            ],
          ],
          baseUri
        );
      }

      break;
    }
  }

  // Show output in a channel
  pgChannel.appendLine(editStderr(data.stderr));
  pgChannel.show();
};

const editStderr = (stderr: string) => {
  // Remove full path
  stderr = stderr.replace(/\s\(\/home.+?(?=\s)/g, "");

  // Remove uuid from folders
  const uuid = PgProgramInfo.get().uuid;
  if (uuid) stderr = stderr.replace(new RegExp(uuid, "gm"), "");

  // Remove rustc error line
  let startIndex = stderr.indexOf("For more");
  if (startIndex !== -1) {
    const endIndex = stderr.indexOf("\n", startIndex);
    stderr = stderr.substring(0, startIndex) + stderr.substring(endIndex + 1);
  }

  // Remove Compiling message
  stderr = stderr.replace("Compiling solpg v0.1.0\n", "");

  // Remove whitespace before 'Finished'
  startIndex = stderr.indexOf("Finished release");
  if (startIndex !== -1) {
    const whiteSpaceStartIndex = startIndex - 7; // 7 is the most amount of whitespace
    stderr =
      stderr.substring(0, whiteSpaceStartIndex) + // Until whitespace start
      stderr.substring(whiteSpaceStartIndex, startIndex).replace(/\s+/, "") +
      "\nBuild successful. Completed" +
      stderr.substring(stderr.indexOf(" in", startIndex)).replace("\n", ".\n"); // Time passed
  }

  return stderr.substring(0, stderr.length - 1);
};
