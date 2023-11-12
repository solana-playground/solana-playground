// Generate TypeScript declarations for the supported packages.

import fs from "fs/promises";
import pathModule from "path";

import { exists, readJSON, REPO_ROOT_PATH, resetDir } from "./utils.mjs";

/** Supported packages path */
const SUPPORTED_PACKAGES_PATH = pathModule.join(
  REPO_ROOT_PATH,
  "supported-packages.json"
);

/** Packages output directory path */
const PACKAGES_PATH = pathModule.join(
  REPO_ROOT_PATH,
  "client",
  "public",
  "packages"
);

/** Renamed index file name(for re-exporting) */
const OLD_INDEX_FILENAME = "old-index.d.ts";

/** All supported packages */
const packages = await readJSON(SUPPORTED_PACKAGES_PATH);

/** Generated packages cache */
const generatedCache = new Set();

/** Map of package name to version */
const versions = {};

// Reset packages directory
await resetDir(PACKAGES_PATH);

// Generate packages
for (const name of packages.importable) {
  await generatePackage(name);
}

// Remove the dependencies that we don't have the types for
for (const name of generatedCache) {
  const depsPath = pathModule.join(PACKAGES_PATH, name, "deps.json");
  let deps = await readJSON(depsPath);
  for (const dep of deps) {
    const depExists = await exists(pathModule.join(PACKAGES_PATH, dep));
    if (!depExists) deps = deps.filter((d) => d !== dep);
  }

  await fs.writeFile(depsPath, JSON.stringify(deps));
}

// Save package versions
await fs.writeFile(
  pathModule.join(PACKAGES_PATH, "versions.json"),
  JSON.stringify(versions)
);

/**
 * Generate package types.
 *
 * @param {string} name package name
 */
async function generatePackage(name) {
  if (generatedCache.has(name)) return;

  // Get all declaration file paths
  const paths = [];

  const packagePath = pathModule.join(
    REPO_ROOT_PATH,
    "client",
    "node_modules",
    name
  );
  const pkg = await getPackage(packagePath);
  if (!pkg) {
    // `@types/node` is handled differently because each file is a different module
    // and we don't want all of them
    paths.push(
      convertPath(
        packagePath.replace(
          "node_modules",
          pathModule.join("node_modules", "@types", "node")
        ) + ".d.ts"
      )
    );
  } else {
    // Parent of `indexPath`, // "../node_modules/@coral-xyz/anchor/dist/cjs"
    const typeRootPath = pathModule.join(pkg.indexPath, "..");
    await recursivelyReadDir(typeRootPath, (path) => {
      const convertedPaths = convertPath(path);

      if (path === pkg.indexPath) {
        // Rename the index to the project name and re-export it from a new index.d.ts
        pkg.indexPath = convertedPaths.monaco;

        paths.unshift({
          ...convertedPaths,
          monaco: pathModule.join(pkg.indexPath, "..", OLD_INDEX_FILENAME),
        });
      } else {
        paths.push(convertedPaths);
      }
    });

    // Add version
    versions[pkg.name] = pkg.version;
  }

  const files = [];
  for (const path of paths) {
    const content = await fs.readFile(
      pathModule.join(REPO_ROOT_PATH, "client", path.webpack),
      "utf8"
    );
    files.push([path.monaco, content]);
  }

  // Don't use old index file name if there is only one file
  if (files.length === 1) {
    files[0][0] = files[0][0].replace(OLD_INDEX_FILENAME, "index.d.ts");
  }

  const packageOutPath = pathModule.join(PACKAGES_PATH, name);
  try {
    await fs.mkdir(packageOutPath, { recursive: true });
  } catch {
  } finally {
    // Save type declarations
    await fs.writeFile(
      pathModule.join(packageOutPath, "types.json"),
      JSON.stringify(files)
    );

    const deps = [];
    if (pkg) {
      // Get transitive dependency names that are being used in types
      deps.push(
        ...Object.entries(pkg)
          .reduce((acc, [key, value]) => {
            switch (key) {
              case "dependencies":
              case "devDependencies":
              case "peerDependencies":
              case "optionalDependencies":
                acc.push(...Object.keys(value));
            }
            return acc;
          }, [])
          .filter((dep) => files.some(([_, content]) => content.includes(dep)))
      );
    }

    // Generate transitive type dependencies
    for (const dep of deps) {
      try {
        // Some package types may not exist
        await generatePackage(dep, { transitive: true });
      } catch {}
    }

    // Save type dependencies
    await fs.writeFile(
      pathModule.join(packageOutPath, "deps.json"),
      JSON.stringify(deps)
    );

    generatedCache.add(name);
  }

  // Only log the packages that are specified(not transitive deps)
  if (packages.importable.includes(name)) {
    // Declarations from `@types/node` don't have a version
    const logData = { name, version: pkg?.version, fileCount: files.length };
    if (!logData.version) delete logData.version;
    console.log(logData);
  }
}

/**
 * Get the type declaration root file from `package.json`.
 *
 * @param {string} path package path
 * @returns the index path and package version
 */
async function getPackage(path) {
  const getTypesPath = async (path) => {
    try {
      const packageJSON = await readJSON(pathModule.join(path, "package.json"));
      if (packageJSON.types) {
        return {
          ...packageJSON,
          indexPath: pathModule.join(path, packageJSON.types),
        };
      }
    } catch {}
  };

  return (
    (await getTypesPath(path)) ??
    (await getTypesPath(
      path.replace("node_modules", pathModule.join("node_modules", "@types"))
    ))
  );
}

/**
 * Convert the given path into a Webpack path(`/` is the client directory) and
 * a Monaco path(without '@').
 *
 * @param {string} path path to convert
 * @returns the converted Webpack and Monaco path
 */
function convertPath(path) {
  const webpack = path.replace(/^.*node_modules\//, "/node_modules/");
  const monaco = webpack.slice(1).replace("//", "/");
  return { webpack, monaco };
}

/**
 * Recursively read dir and run the given callback on declaration files.
 *
 * @param {string} path directory path
 * @param {(declarationFilePath: string) => void} cb callback function to run
 */
async function recursivelyReadDir(path, cb) {
  const dir = await fs.readdir(path);
  for (const fileName of dir) {
    const childPath = pathModule.join(path, fileName);
    const stat = await fs.stat(childPath);
    if (stat.isDirectory()) {
      if (childPath.endsWith("node_modules")) continue;
      await recursivelyReadDir(childPath, cb);
    } else if (fileName.endsWith(".d.ts")) {
      cb(childPath);
    }
  }
}
