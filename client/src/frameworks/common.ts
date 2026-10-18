import {
  MergeUnion,
  PgCommon,
  PgConnection,
  PgExplorer,
  PgFramework,
  PgJsPackage,
  PgLanguage,
  PgProgramInfo,
  PgView,
  TupleFiles,
  ValueOf,
} from "../utils";
import { SelectProgram } from "./SelectProgram";

/** Map of dependency name -> version */
type Dependencies = { [dependencyName: string]: string };

/** Import statement regular expression with multi-line support */
export const IMPORT_STATEMENT_REGEX = /import(.|\n)*?["|'].*["|'](;?)/;

/**
 * Add the given content after the regular expression.
 *
 * @param content original content
 * @param afterRegex add after this regular expression
 * @param newContent new content to add
 * @param opts options
 * - `firstOccurance`: Add after the first occurance of the regex(defaults to last)
 * @returns the content with the new content added
 */
export const addAfter = (
  content: string,
  afterRegex: RegExp,
  newContent: string,
  opts?: { firstOccurance?: boolean }
) => {
  const occuranceIndex = opts?.firstOccurance ? 0 : -1;
  const match = PgCommon.matchAll(content, afterRegex).at(occuranceIndex);
  const afterStartIndex = (match?.index ?? 0) + (match?.at(0)?.length ?? 0) + 1;
  content =
    content.slice(0, afterStartIndex) +
    newContent +
    "\n" +
    content.slice(afterStartIndex);

  return content;
};

/**
 * Get `Cargo.toml` dependencies from the given files.
 *
 * @param files all files
 * @returns the dependency list
 */
export const getRustDependencies = async (files: TupleFiles) => {
  const versions = await getVersions("crates");
  const getVersion = (crateName: string) => versions[crateName] ?? "*";

  const dependencies: Dependencies = {};
  const rustContents = files
    .filter(([path]) => path.endsWith(".rs"))
    .map(([_, content]) => content);

  for (const content of rustContents) {
    for (const crateName of CRATES.importable) {
      const dependencyName = PgCommon.toKebabFromSnake(crateName);
      if (
        !dependencies[dependencyName] &&
        new RegExp(`${crateName}::`, "gm").test(content)
      ) {
        dependencies[dependencyName] = getVersion(dependencyName);
      }
    }
  }

  return Object.entries(dependencies).reduce((acc, [name, version]) => {
    return acc + `\n${name} = "${version}"`;
  }, "[dependencies]");
};

/**
 * Get `package.json` dependencies from the given files.
 *
 * @param files all files
 * @returns the dependency list
 */
export const getJsDependencies = async (files: TupleFiles) => {
  const versions = await getVersions("packages");
  const getVersion = (packageName: string) => versions[packageName] ?? "*";

  const dependencies: Dependencies = {};
  const jsContents = files
    .filter(([path]) => PgLanguage.getIsPathJsLike(path))
    .map(([_, content]) => content);

  for (const content of jsContents) {
    // Importables
    for (const packageName of PACKAGES.importable) {
      if (
        !dependencies[packageName] &&
        new RegExp(`("|')${packageName}("|')`, "gm").test(content)
      ) {
        dependencies[packageName] = getVersion(packageName);
      }
    }

    // Globals
    for (const packageName of Object.keys(getGlobalPackages(content))) {
      dependencies[packageName] = getVersion(packageName);
    }
  }

  const devDependencies: Dependencies = {
    "@types/bn.js": "^5.1.1",
    "@types/chai": "^4.3.5",
    "@types/mocha": "^10.0.1",
    chai: "^4.3.8",
    mocha: "^10.2.0",
    prettier: "^3.0.2",
    "ts-mocha": "^10.0.0",
    typescript: "^5.2.2",
  };

  return PgCommon.toPrettyJson({ dependencies, devDependencies }).slice(2, -2);
};

/**
 * Get a map of names to versions.
 *
 * @param kind `crates` or `packages`
 * @returns versions map
 */
const getVersions = async (
  kind: "crates" | "packages"
): Promise<Record<string, string>> => {
  return await PgCommon.fetchJson(`/${kind}/versions.json`);
};

/**
 * Add imports for files that use Playground globals.
 *
 * @param content JS/TS code
 * @returns the content with the added imports
 */
export const addImports = (content: string) => {
  // New projects already have imports
  if (IMPORT_STATEMENT_REGEX.test(content)) return content;

  // Remove the "No imports needed:..." comment
  const noImportsStartIndex = content.indexOf("// No imports needed");
  if (noImportsStartIndex !== -1) {
    const noImportsEndIndex =
      noImportsStartIndex + content.slice(noImportsStartIndex).indexOf("\n");
    content =
      content.slice(0, noImportsStartIndex) +
      content.slice(noImportsEndIndex + 1);
  }

  // Add imports for Playground globals
  const globalPackages = getGlobalPackages(content);
  for (const [packageName, importStyle] of Object.entries(globalPackages)) {
    const style = importStyle as Partial<MergeUnion<typeof importStyle>>;
    const importStyleText = style.as
      ? `* as ${style.as}`
      : style.named
      ? `{ ${style.named} }`
      : style.default;
    content = `import ${importStyleText} from "${packageName}";\n` + content;
  }

  return content;
};

/**
 * Get global packages that are used in the given content.
 *
 * @param content JS/TS code
 * @returns a map of package name to import style
 */
const getGlobalPackages = (content: string) => {
  const packages: Record<string, ValueOf<typeof PACKAGES["global"]>> = {};
  for (const [_packageName, importStyle] of PgCommon.entries(PACKAGES.global)) {
    if (PACKAGES_MAP[_packageName] === null) continue;
    const packageName = PACKAGES_MAP[_packageName] ?? _packageName;

    const style = importStyle as Partial<MergeUnion<typeof importStyle>>;
    const name = style.as ?? style.named ?? style.default;

    const accessors = [name + ".", name + "("];
    for (const accessor of accessors) {
      if (!packages[packageName] && content.includes(accessor)) {
        packages[packageName] = importStyle;
      }
    }
  }

  return packages;
};

/** Map packages to a different package on exports or completely ignore them */
const PACKAGES_MAP: {
  [key: string]: string | null;
} = {
  buffer: null, // No need to import
};

/**
 * Convert the given `files` to playground layout.
 *
 * @param files files with the framework layout
 * @returns the files with playground layout
 */
export const convertToPlaygroundCommon = async (files: TupleFiles) => {
  const rustProjectPaths = getRustProjectPaths(files);
  // Get only the program members and exclude the rest, e.g. examples, macros,
  // tests...
  const programPaths = rustProjectPaths.filter((projectPath) => {
    const projectFiles = files.filter(([path]) => path.startsWith(projectPath));
    return PgFramework.getFromFiles(projectFiles);
  });
  if (programPaths.length > 1) {
    const programPath = await selectProgram(programPaths);
    // TODO: Also exclude the tests of other programs
    const pathsToExclude = rustProjectPaths.filter((p) => p !== programPath);
    files = files.filter(
      ([path]) => !pathsToExclude.some((p) => path.startsWith(p))
    );
  }

  const pgFiles: TupleFiles = [];
  for (const [path, content] of files) {
    // **/src/**/*.rs -> src/**/*.rs
    const programSrcResult = /src\/(?!.*src\/).*\.rs$/.exec(path);
    if (programSrcResult) {
      pgFiles.push([programSrcResult[0], content]);
      continue;
    }

    // **/Cargo.toml -> Cargo.toml (only if there is an `src` dir next to it)
    const cargoTomlResult = /.*Cargo\.toml$/.exec(path);
    if (cargoTomlResult) {
      const cargoTomlPath = cargoTomlResult[0];
      const srcPath = cargoTomlPath.includes("/")
        ? PgCommon.joinPaths(
            PgExplorer.getParentPathFromPath(cargoTomlPath),
            PgExplorer.PATHS.SRC_DIRNAME
          )
        : PgExplorer.PATHS.SRC_DIRNAME;
      const hasSrc = files.some(([path]) => path.startsWith(srcPath));
      if (!hasSrc) continue;

      const strippedCargoTomlResult = /Cargo\.toml$/.exec(path);
      if (!strippedCargoTomlResult) continue;

      pgFiles.push([strippedCargoTomlResult[0], content]);
      continue;
    }

    // TODO: After Rust test support: **/programs/*/tests/** -> tests/**

    // **/Cargo.lock -> Cargo.lock
    const cargoLockResult = /Cargo.lock$/.exec(path);
    if (cargoLockResult) {
      pgFiles.push([cargoLockResult[0], content]);
      continue;
    }

    // **/client/**/*.ts -> client/**/*.ts
    const clientResult = /client\/(?!.*client\/).*\.(js|ts)$/.exec(path);
    if (clientResult) {
      pgFiles.push([clientResult[0], content]);
      continue;
    }

    // **/tests/**/*.ts -> tests/**/*.test.ts
    const testsResult = /tests\/(?!.*tests\/).*\.(js|ts)$/.exec(path);
    if (testsResult) {
      const path = testsResult[0].replace(/(\.test)?\.(js|ts)$/, ".test.ts");
      pgFiles.push([path, content]);
      continue;
    }

    // **/<js_package_file> -> <js_package_file>
    const jsPackageResult = /(package.json|package-lock.json|yarn.lock)$/.exec(
      path
    );
    if (jsPackageResult) {
      pgFiles.push([jsPackageResult[0], content]);
      continue;
    }
  }

  return pgFiles;
};

/**
 * Get the program names from the given framework layout files.
 *
 * @param files framework layout files
 * @returns the program names
 */
const getRustProjectPaths = (files: TupleFiles) => {
  // Get Cargo workspace if it exists
  const workspaceManifest = files
    .filter(([path, content]) => {
      return path.endsWith("Cargo.toml") && content.includes("[workspace]");
    })
    .map((file) => [...file, file[0].split("/").length] as const)
    .sort((a, b) => a[2] - b[2])
    .at(0);

  if (workspaceManifest) {
    const membersResult = /\[workspace\]members\s+=\s+(\[.*?\])/.exec(
      workspaceManifest[1].replaceAll("\n", "")
    );
    if (membersResult) {
      const members: string[] = JSON.parse(membersResult[1].replace(",]", "]"));
      return members.flatMap((member) => {
        if (!member.endsWith("/*")) {
          return PgCommon.joinPaths(
            PgExplorer.getParentPathFromPath(workspaceManifest[0]),
            PgCommon.appendSlash(member)
          );
        }

        // Expand globs
        const parent = member.replace("/*", "");
        const regex = new RegExp(`.*\\/${parent}\\/[^\\/]*/`);
        return PgCommon.toUniqueArray(
          files
            .map(([path]) => regex.exec(path))
            .filter(PgCommon.isNonNullish)
            .map((result) => result[0])
        );
      });
    }
  }

  // No workspace but there could still be multiple programs or other Rust
  // projects
  const CARGO_TOML_REGEX = /.*Cargo\.toml$/;
  // Example value: ["/name/client/", "/name/program/"]
  return files
    .map(([path]) => CARGO_TOML_REGEX.exec(path))
    .filter(PgCommon.isNonNullish)
    .map((result) => result[0])
    .map(PgExplorer.getParentPathFromPath);
};

/**
 * Show select program modal.
 *
 * @param programNames program names to select from
 * @throws if the user cancels the selection
 * @returns the selected program name
 */
const selectProgram = async (programNames: string[]) => {
  const programName: string | null = await PgView.setModal(SelectProgram, {
    programNames,
  });
  if (!programName) throw new Error("Program not selected");
  return programName;
};

/**
 * Convert playground layout files to the framework's layout with a single
 * program directory.
 *
 * @param files playground layout files
 * @returns the framework layout files
 */
export const convertFromPlaygroundToSingleProgramLayout = async (
  files: TupleFiles
) => {
  const PROGRAM_PATH = "program";

  const frameworkFiles: TupleFiles = [];
  for (let [path, content] of files) {
    // Program files -> `program/`
    if (
      path.startsWith(PgExplorer.PATHS.SRC_DIRNAME) ||
      path === "Cargo.toml" ||
      path === "Cargo.lock"
    ) {
      path = PgCommon.joinPaths(PROGRAM_PATH, path);
    }

    // `client` dir stays the same
    else if (path.startsWith(PgExplorer.PATHS.CLIENT_DIRNAME)) {
      content = convertJs(content);
    }

    // `tests` dir stays the same
    else if (path.startsWith(PgExplorer.PATHS.TESTS_DIRNAME)) {
      content = convertJs(content);
    }

    // JS manifest and lock do not need conversion
    else if (
      path === "package.json" ||
      path === "package-lock.json" ||
      path === "yarn.lock"
    ) {
    }

    // Don't include other files
    else continue;

    frameworkFiles.push([path, content]);
  }

  const hasRustManifest = files.some(([path]) => path === "Cargo.toml");
  if (!hasRustManifest) {
    frameworkFiles.push([
      PgCommon.joinPaths(PROGRAM_PATH, "Cargo.toml"),
      `[package]
name = "${PgCommon.toKebabFromTitle(
        PgExplorer.currentWorkspaceName ?? "program"
      )}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[features]
no-entrypoint = []

${await getRustDependencies(files)}
`,
    ]);
  }

  const hasJsManifest = files.some(([path]) => path === "package.json");
  if (!hasJsManifest) {
    frameworkFiles.push(
      [
        "package.json",
        `{
  "scripts": {
    "lint:fix": "prettier */*.js \\"*/**/*{.js,.ts}\\" -w",
    "lint": "prettier */*.js \\"*/**/*{.js,.ts}\\" --check",
    "client": "yarn run ts-node client/*.ts",
    "test": "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
  },
${await getJsDependencies(frameworkFiles)}
}
`,
      ],

      [
        ".prettierignore",
        `.DS_Store
target
test-ledger
`,
      ]
    );
  }

  // Add the files that don't exist in Playground
  frameworkFiles.push(
    [
      ".gitignore",
      `.DS_Store
target
node_modules
test-ledger
`,
    ],

    [
      "tsconfig.json",
      `{
  "compilerOptions": {
    "types": ["mocha", "chai"],
    "lib": ["es2020"],
    "module": "esnext",
    "target": "es2020",
    "esModuleInterop": true
  }
}
`,
    ]
  );

  return frameworkFiles;
};

/**
 * Try to make the JS/TS file work in a local `node` environment by making the
 * necessary conversions.
 *
 * @param content JS/TS code
 * @returns the converted content
 */
const convertJs = (content: string) => {
  const manifest = PgCommon.tryCall(PgJsPackage.getParsedManifest);
  if (!manifest) content = addImports(content);

  // Define Playground globals
  content = addAfter(
    content,
    IMPORT_STATEMENT_REGEX,
    `
// Manually initialize variables that are automatically defined in Playground
const PROGRAM_ID = new web3.PublicKey(${
      PgProgramInfo.pk ? `"${PgProgramInfo.pk.toBase58()}"` : "/* Program id */"
    });
const connection = new web3.Connection("${
      PgConnection.current.rpcEndpoint
    }", "${PgConnection.current.commitment}");
const wallet = { keypair: web3.Keypair.generate() };`
  );

  // Handle the `pg` namespace
  return content
    .replaceAll("pg.PROGRAM_ID", "PROGRAM_ID")
    .replaceAll("pg.connection", "connection")
    .replaceAll("pg.wallet.keypair", "wallet.keypair")
    .replaceAll("pg.wallet.publicKey", "wallet.keypair.publicKey")
    .replaceAll("pg", "{ PROGRAM_ID, connection, wallet }");
};
