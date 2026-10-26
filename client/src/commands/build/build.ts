import {
  PgCommand,
  PgCommon,
  PgExplorer,
  PgFramework,
  PgGlobal,
  PgLanguage,
  PgProgramInfo,
  PgServer,
  PgSettings,
  PgTemplate,
  PgTerminal,
  PgWasmPackage,
  PgWeb3,
  TupleFiles,
} from "../../utils";
import { createCmd } from "../create";

export const build = createCmd({
  name: "build",
  description: "Build your program",
  handle: async () => {
    PgGlobal.update({ buildLoading: true });
    PgTerminal.println(PgTerminal.info("Building..."));

    try {
      const result = await buildProgram();
      // TODO: Remove conditional and inline
      // Server only returns `uuid` on the first build of a session, so we
      // can't use it as a success signal. Mirror the server's own check on
      // `stderr` so deploy can warn before reusing a stale binary.
      const failed = PgSettings.experimental.unstable
        ? !result.success
        : result.stderr.includes("error: could not compile");
      PgProgramInfo.update({
        idl: result.idl,
        uuid: result.uuid ?? undefined,
        lastBuildFailed: failed,
      });
      PgTerminal.print(improveOutput(result));
    } finally {
      PgGlobal.update({ buildLoading: false });
    }
  },
});

/**
 * Compile the current project.
 *
 * @returns the build response
 */
const buildProgram = async () => {
  const buildFiles = getBuildFiles();
  const pythonFiles = buildFiles.filter(
    ([path]) => PgLanguage.getFromPath(path)?.name === "Python"
  );
  if (pythonFiles.length > 0) return await buildPython(pythonFiles);
  return await buildRust(buildFiles);
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

  /**
   * Update the `declare_id!` macro in Rust source content with the current
   * program's public key.
   *
   * @param content - The Rust source file content as a string
   * @returns An object containing:
   * - `content` - The updated source content with the new program ID injected
   * - `updated` - A boolean indicating whether the ID was updated
   */
  const updateIdRust = (content: string) => {
    let updated = false;
    let insideBlockComment = false;
    const rustDeclareIdRegex = /^(([\w]+::)*)declare_id!\("(\w*)"\)/;
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
    const content = files[path].content;
    if (content) {
      switch (PgLanguage.getFromPath(path)?.name) {
        case "Rust":
          return updateIdRust(content);
        case "Python":
          return updateIdPython(content);
      }
    }

    return { content, updated: false };
  };

  const files = PgExplorer.files;
  const buildFiles: TupleFiles = [];
  let alreadyUpdatedId = false;

  // Prioritize files where we are likely to find a rust `declare_id!`
  const prioritizedFileNames = ["lib.rs", "id.rs"];
  const prioritizedFilePaths = Object.keys(files).reduce((acc, path) => {
    if (prioritizedFileNames.some((n) => path.endsWith(n))) acc.unshift(path);
    else acc.push(path);

    return acc;
  }, [] as string[]);
  for (const path of prioritizedFilePaths) {
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
      PgExplorer.toRelativePath(path)
    );
    buildFiles.push([buildPath, content]);
  }

  // Add unstable files
  if (PgSettings.experimental.unstable) {
    const manifest = PgExplorer.getFileContent("Cargo.toml");
    if (manifest) buildFiles.push(["Cargo.toml", manifest]);
    const lockFile = PgExplorer.getFileContent("Cargo.lock");
    if (lockFile) buildFiles.push(["Cargo.lock", lockFile]);

    const idlsDir = PgExplorer.getFolderContent("idls");
    if (idlsDir) {
      for (const fileName of idlsDir.files) {
        const path = PgCommon.joinPaths("idls", fileName);
        buildFiles.push([path, PgExplorer.getFileContent(path)!]);
      }
    }
  }

  return buildFiles;
};

/**
 * Convert Python files into Rust with `seahorse-compile-wasm` and run `buildRust`.
 *
 * @param pythonFiles Python files in `src/`
 * @returns the build response
 */
const buildPython = async (pythonFiles: TupleFiles) => {
  const { compileSeahorse } = await PgWasmPackage.import("seahorse-compile");

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
 * Build Rust files and return the output.
 *
 * @param files Rust program files
 * @returns the build response
 */
const buildRust = async (
  files: TupleFiles,
  opts?: { noTemplateRecovery?: boolean }
): ReturnType<typeof PgServer["build"]> => {
  if (!files.length) throw new Error("Couldn't find any Rust files.");

  try {
    return await PgServer.build({
      files,
      uuid: PgProgramInfo.uuid,
      flags: PgSettings.build.flags,
    });
  } catch (e: any) {
    const SERVER_BUILD_TEMPLATE_NOT_FOUND_ERROR =
      "Failed to find a build template";
    if (!e?.message?.includes?.(SERVER_BUILD_TEMPLATE_NOT_FOUND_ERROR)) throw e;
    // TODO: Ask to migrate to an existing template?
    if (opts?.noTemplateRecovery) throw new Error("Failed to recover");

    PgTerminal.println(`Warning: ${SERVER_BUILD_TEMPLATE_NOT_FOUND_ERROR}`);

    const manifestFile = files.find(([path]) => path === "Cargo.toml");
    if (!manifestFile) {
      throw new Error("Request does not contain a manifest file");
    }

    const PACKAGE_NAME_VERSION_REGEX =
      /\[package\]name\s*=\s*"(.*?)"version\s*=\s*"(.*?)"/;
    const result = PACKAGE_NAME_VERSION_REGEX.exec(
      manifestFile[1].replaceAll("\n", "")
    );
    if (!result) throw new Error("Failed to parse manifest");

    const [, name, version] = result;
    PgTerminal.println(`Name: ${name}`);

    const updateManifestAndRetry = async (templateFiles: TupleFiles) => {
      const templateManifest = templateFiles.find(([path, content]) => {
        return (
          path.endsWith("Cargo.toml") &&
          PACKAGE_NAME_VERSION_REGEX.exec(content.replaceAll("\n", ""))?.at(
            1
          ) === name
        );
      });
      if (!templateManifest) {
        throw new Error("Failed to find the manifest file in the template");
      }

      await PgExplorer.saveItem(...templateManifest);

      // Change the manifest in-place and retry
      manifestFile[1] = templateManifest[1];
      const result = await buildRust(files, { noTemplateRecovery: true });
      PgTerminal.println(PgTerminal.success("Update successful."));
      return result;
    };

    // Handle the migration of `<name>` style templates
    const nameBasedTemplate = TEMPLATES.find((t) => t === name);
    if (nameBasedTemplate) {
      const files = await PgTemplate.getFiles(nameBasedTemplate);
      return await updateManifestAndRetry(files);
    }

    PgTerminal.println(`Version: ${version}`);

    // Handle the migration of `<framework>-<version>` style templates
    const framework = PgFramework.all.find(
      (f) => f.name.toLowerCase() === name
    );
    // TODO: Ask to migrate to an existing template?
    if (!framework) throw new Error(`Framework not found: ${name}`);

    const updateFrameworkManifestAndRetry = async (version: string) => {
      const templateFiles = await framework.getTemplateFiles(version);
      const { convertToPlayground } = await framework.import();
      const pgFiles = await convertToPlayground(templateFiles);
      return await updateManifestAndRetry(pgFiles);
    };

    // Possibilities
    // 1. Template manifest has been modified (same name and version)
    const versionExists = framework.versions.includes(version);
    if (versionExists) return await updateFrameworkManifestAndRetry(version);

    // 2. Template version has been bumped to a compatible version
    for (const frameworkVersion of framework.versions) {
      if (!PgCommon.isNonBreakingVersionChange(version, frameworkVersion)) {
        continue;
      }

      PgTerminal.println(`New version available: ${frameworkVersion}`);
      return await updateFrameworkManifestAndRetry(frameworkVersion);
    }

    // 3. Template version has been removed and there are no compatible versions
    const term = await PgTerminal.get();
    const selectedVersion = await term.waitForInput(
      "Could not find a compatible version. Choose one of the supported versions.",
      { choice: { items: framework.versions } }
    );
    return await updateFrameworkManifestAndRetry(selectedVersion);
  }
};

/**
 * Solutions to suggest for common build errors.
 *
 * The `pattern` is tested against a single error rather than the full output.
 */
const SUGGESTIONS = [
  {
    // Deriving `InitSpace` implements the `Space` trait, which is what
    // provides the `INIT_SPACE` constant. Using the derive macro's name as if
    // it were the constant is a common mistake.
    pattern: /no associated item named `InitSpace` found/,
    suggestion:
      "The constant is named `INIT_SPACE`, not `InitSpace`. It's generated by adding `#[derive(InitSpace)]` to the struct.",
  },
  {
    pattern: /no associated item named `INIT_SPACE` found/,
    suggestion:
      "Add `#[derive(InitSpace)]` to the struct in order to generate `INIT_SPACE`.",
  },
];

/**
 * Improve the output that is returned from the build request.
 *
 * @param output build output
 * @returns the improved output
 */
const improveOutput = (output: { stdout: string; stderr: string }) => {
  let { stdout, stderr } = output;

  stderr = stderr
    // Blocking "waiting for file lock on package cache"
    .replaceAll("Blocking waiting for file lock on package cache\n", "")

    // Remove full paths
    .replace(/(\S*\/)src/gm, (match, head) => match.replace(head, ""))
    .replace(/\s\(\/home.+?(?=\s)/gm, "")
    .replace(/(\/home\/\w+)\//gm, (match, home) => match.replace(home, "~"))

    // Replace `solpg` name with the current workspace name
    .replaceAll("solpg", PgExplorer.currentWorkspaceName ?? "solpg")

    // Remove compiling output
    .replace(/\s+Compiling [^\n]*/gm, "")

    // Remove (run `cargo fix --lib -p program` to apply 1 suggestion)
    .replace(/\(run `cargo fix --lib[^)]*\)/gm, "")

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
  if (uuid) stderr = stderr.replace(new RegExp(`${uuid}\\/?`, "gm"), "");

  // Remove `rustc` error line
  let startIndex = stderr.indexOf("For more");
  if (startIndex !== -1) {
    const endIndex = stderr.indexOf("\n", startIndex);
    stderr = stderr.slice(0, startIndex) + stderr.slice(endIndex + 1);
  }

  // TODO: Remove
  if (!PgSettings.experimental.unstable) {
    // Remove the whitespace before `rustc` finished text
    startIndex = stderr.indexOf("Finished `release`");
    if (startIndex !== -1) {
      const whiteSpaceStartIndex = startIndex - 7; // 7 is the most amount of whitespace
      stderr =
        stderr.slice(0, whiteSpaceStartIndex) + // until whitespace start
        stderr.slice(whiteSpaceStartIndex, startIndex).replaceAll(" ", "") +
        PgTerminal.success("Build successful. ") +
        "Completed" +
        stderr.slice(stderr.indexOf(" in", startIndex)).replace("\n", ".\n"); // Time passed
    }

    // Trim the last newline
    if (stderr) stderr = stderr.slice(0, stderr.length - 1);
  }

  // Improve errors
  if (PgSettings.build.improveErrors) {
    const MAX_ERROR_AMOUNT = 3;

    const errorIndices = PgCommon.matchAll(stderr, /error[:[]/)
      .map((match) => match.index)
      .filter(PgCommon.isNonNullish);
    if (errorIndices.length) {
      const errors = errorIndices
        .map((errorIndex, i) => stderr.slice(errorIndex, errorIndices[i + 1]))
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
        const shownErrors = displayErrors.slice(0, MAX_ERROR_AMOUNT);
        stderr = shownErrors.reduce((acc, cur) => acc + cur, "");

        // Suggest solutions for common errors. Only the shown errors are
        // checked because suggesting a solution for an error that is not in
        // the output would be confusing.
        const suggestions = SUGGESTIONS.filter((s) => {
          return shownErrors.some((err) => s.pattern.test(err));
        });
        for (const { suggestion } of suggestions) {
          stderr += `Suggestion: ${suggestion}\n`;
        }

        if (displayErrors.length > MAX_ERROR_AMOUNT) {
          stderr += `Note: This is a shorter version of the error logs to make \
it easier to debug. Currently ${PgTerminal.bold(MAX_ERROR_AMOUNT.toString())} \
errors are displayed but there are \
${PgTerminal.bold(displayErrors.length.toString())} errors.
\tRun \`${PgCommand.setting.name} set build.improveErrors false\` to disable \
this setting and re-run the build command to see the full error output.
`;
        }
      }
    }
  }

  if (stderr.startsWith("\n")) stderr = stderr.slice(1, stderr.length);

  // TODO: Always show both (`PgSettings.experimental.unstable`)
  return stdout ? stderr + stdout : stderr;
};
