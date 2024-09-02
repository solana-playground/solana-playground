import {
  ExplorerFiles,
  PgCommon,
  PgExplorer,
  PgGlobal,
  PgPackage,
  PgProgramInfo,
  PgServer,
  PgSettings,
  PgTerminal,
  PgWeb3,
  TupleFiles,
} from "../../utils/pg";
import { createCmd } from "../create";

export const build = createCmd({
  name: "build",
  description: "Build your program",
  run: async () => {
    PgGlobal.update({ buildLoading: true });
    PgTerminal.log(PgTerminal.info("Building..."));

    let msg;
    try {
      const output = await processBuild();
      msg = improveOutput(output.stderr);
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Build error: ${convertedError}`;
    } finally {
      PgTerminal.log(msg + "\n");
      PgGlobal.update({ buildLoading: false });
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

  const resp = await PgServer.build({
    files,
    uuid: PgProgramInfo.uuid,
    flags: PgSettings.build.flags,
  });

  // Update program info
  PgProgramInfo.update({
    uuid: resp.uuid ?? undefined,
    idl: resp.idl,
  });

  return { stderr: resp.stderr };
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
    const kp = PgWeb3.Keypair.generate();
    PgProgramInfo.update({ kp });
    programPkStr = kp.publicKey.toBase58();
  }

  const updateIdRust = (content: string) => {
    let updated = false;

    const rustDeclareIdRegex = /^(([\w]+::)*)declare_id!\("(\w*)"\)/gm;
    const newContent = content.replace(rustDeclareIdRegex, (match) => {
      const res = rustDeclareIdRegex.exec(match);
      if (!res) return match;
      updated = true;

      // res[1] could be solana_program:: or undefined
      return (res[1] ?? "\n") + `declare_id!("${programPkStr}")`;
    });

    return { content: newContent, updated };
  };

  const updateIdPython = (content: string) => {
    let updated = false;

    const pythonDeclareIdRegex = /^declare_id\(("|')(\w*)("|')\)/gm;
    const newContent = content.replace(pythonDeclareIdRegex, (match) => {
      const res = pythonDeclareIdRegex.exec(match);
      if (!res) return match;
      updated = true;
      return `declare_id('${programPkStr}')`;
    });

    return { content: newContent, updated };
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

  for (const path of prioritisedFilePaths) {
    if (!path.startsWith(PgExplorer.getCurrentSrcPath())) continue;

    let content = files[path].content;
    if (!alreadyUpdatedId) {
      const updateIdResult = getUpdatedProgramIdContent(path);
      content = updateIdResult.content;
      alreadyUpdatedId = updateIdResult.updated;
    }
    if (!content) continue;

    // Remove the workspace from path because build only needs /src
    const buildPath = PgCommon.joinPaths(
      PgExplorer.PATHS.ROOT_DIR_PATH,
      PgExplorer.getRelativePath(path)
    );
    buildFiles.push([buildPath, content]);
  }

  return buildFiles;
};

/**
 * Improve build output that is returned from the build request.
 *
 * @param output build output(stderr)
 * @returns the improved output
 */
const improveOutput = (output: string) => {
  output = output
    // Blocking "waiting for file lock on package cache"
    .replaceAll("Blocking waiting for file lock on package cache\n", "")

    // Remove full paths
    .replace(/(\S*\/)src/gm, (match, head) => match.replace(head, ""))
    .replace(/\s\(\/home.+?(?=\s)/gm, "")
    .replace(/(\/home\/\w+)\//gm, (match, home) => match.replace(home, "~"))

    // Remove compiling output
    .replace(/\s*Compiling\ssolpg.*/, "")

    // Replace `solpg` name with the current workspace name
    .replaceAll("solpg", PgExplorer.currentWorkspaceName ?? "solpg")

    // Remove stack size error
    .replace(/^\s*Error:\sFunction.*\n/gm, "")

    // Remove nightly macro backtrace
    .replaceAll(
      "(in Nightly builds, run with -Z macro-backtrace for more info)",
      ""
    )

    // Remove `Some errors have detailed explanations: E0412, E0432, E0433.`
    .replace(/Some\serrors\shave\sdetailed\sexplanations:.*/, "");

  // Remove uuid from folders
  const uuid = PgProgramInfo.uuid;
  if (uuid) output = output.replace(new RegExp(`${uuid}\\/?`, "gm"), "");

  // Remove `rustc` error line
  let startIndex = output.indexOf("For more");
  if (startIndex !== -1) {
    const endIndex = output.indexOf("\n", startIndex);
    output = output.substring(0, startIndex) + output.substring(endIndex + 1);
  }

  // Remove whitespace before `rustc` finished text
  startIndex = output.indexOf("Finished release");
  if (startIndex !== -1) {
    const whiteSpaceStartIndex = startIndex - 7; // 7 is the most amount of whitespace
    output =
      output.substring(0, whiteSpaceStartIndex) + // Until whitespace start
      output.substring(whiteSpaceStartIndex, startIndex).replaceAll(" ", "") +
      PgTerminal.success("Build successful. ") +
      "Completed" +
      output.substring(output.indexOf(" in", startIndex)).replace("\n", ".\n"); // Time passed
  }

  output = output.substring(0, output.length - 1);

  // Improve errors
  if (PgSettings.build.improveErrors) {
    const MAX_ERROR_AMOUNT = 3;

    const errorIndices = PgCommon.matchAll(output, /error[:[]/)
      .map((match) => match.index)
      .filter(PgCommon.isNonNullish);
    if (errorIndices.length) {
      const errors = errorIndices
        .map((errorIndex, i) => output.slice(errorIndex, errorIndices[i + 1]))
        .filter((err) => !err.includes("could not compile"));

      // Hide common useless errors i.e. some errors such as:
      // ```
      //   error[E0432]: unresolved import `crate`
      //   --> src/lib.rs:7:1
      //   |
      // 7 | #[program]
      //   | ^^^^^^^^^^ could not find `__client_accounts_initialize` in the crate root
      // ```
      //
      // Macro errors like the above are not the cause of the error, they are a
      // symptom of another error.
      const HIDDEN_PATTERNS = [
        "__client_accounts",
        "__cpi_client_accounts",
        /`\S*Bumps`/,
      ];
      const hiddenErrors = errors.reduce((acc, cur) => {
        const isHidden = HIDDEN_PATTERNS.some((pat) => {
          return typeof pat === "string" ? cur.includes(pat) : pat.test(cur);
        });
        if (isHidden) acc.push(cur);

        return acc;
      }, [] as string[]);

      // Prioritize the most common errors, order matters
      const prioritizedErrors: string[] = [];
      for (const error of errors) {
        if (hiddenErrors.includes(error)) continue;
        if (error.includes("cannot find")) prioritizedErrors.unshift(error);
      }
      prioritizedErrors.reverse();

      const remainingErrors = errors.filter(
        (err) => !prioritizedErrors.includes(err) && !hiddenErrors.includes(err)
      );
      const displayErrors = prioritizedErrors.concat(remainingErrors);

      // Output should be overridden only in the case of display errors length
      // being non-zero
      if (displayErrors.length) {
        output = displayErrors.reduce(
          (acc, cur, i) => (i < MAX_ERROR_AMOUNT ? acc + cur : acc),
          ""
        );

        if (displayErrors.length > MAX_ERROR_AMOUNT) {
          output += [
            "Note: This is a shorter version of the error logs to make it easier to debug.",
            `Currently ${PgTerminal.bold(
              MAX_ERROR_AMOUNT.toString()
            )} errors are displayed but there are ${PgTerminal.bold(
              displayErrors.length.toString()
            )} errors.`,
            'Disable "Improve build errors" setting to see the full error output.',
          ].join(" ");
        }
      }
    }
  }

  return output;
};
