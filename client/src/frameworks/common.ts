import {
  MergeUnion,
  PgCommon,
  PgLanguage,
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
export const getJSDependencies = async (files: TupleFiles) => {
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
 * Show select program modal.
 *
 * @param programNames program names to select from
 * @throws if the user cancels the selection
 * @returns the selected program name
 */
export const selectProgram = async (programNames: string[]) => {
  const programName: string | null = await PgView.setModal(SelectProgram, {
    programNames,
  });
  if (!programName) throw new Error("Program not selected");

  return programName;
};

/**
 * Convert the given `files` to playground layout.
 *
 * @param files files with the framework layout
 * @returns the files with playground layout
 */
export const convertToPlaygroundCommon = (files: TupleFiles) => {
  const pgFiles: TupleFiles = [];
  for (const [path, content] of files) {
    // **/programs/*/src/** -> src/**
    const programSrcResult = /programs\/(?!.*programs\/)[^/]*\/(src\/.*)$/.exec(
      path
    );
    if (programSrcResult) {
      pgFiles.push([programSrcResult[1], content]);
      continue;
    }

    // **/programs/*/Cargo.(toml|lock) -> Cargo.(toml|lock)
    const programCargoFiles =
      /programs\/(?!.*programs\/)[^/]*\/(Cargo.(toml|lock))$/.exec(path);
    if (programCargoFiles) {
      pgFiles.push([programCargoFiles[1], content]);
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
