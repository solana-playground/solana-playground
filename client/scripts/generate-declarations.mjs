// Generate TypeScript declarations for the supported packages.

import * as fs from "fs/promises";
import pathModule from "path";

/** Packages output directory */
const PACKAGES_PATH = pathModule.join("..", "public", "packages");

/** Renamed index file name(for re-exporting) */
const OLD_INDEX_FILENAME = "old-index.d.ts";

/** All supported packages */
const packages = JSON.parse(
  await fs.readFile(pathModule.join("..", "..", "supported-packages.json"))
);

for (const name of packages) {
  // Get all declaration file paths
  const paths = [];

  const packagePath = pathModule.join("..", "node_modules", name);
  let indexPath = await getIndexPath(packagePath);
  if (!indexPath) {
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
    const typeRootPath = pathModule.join(indexPath, "..");
    await recursivelyReadDir(typeRootPath, (path) => {
      const convertedPaths = convertPath(path);

      if (path === indexPath) {
        // Rename the index to the project name and re-export it from a new index.d.ts
        indexPath = convertedPaths.monaco;

        paths.unshift({
          ...convertedPaths,
          monaco: pathModule.join(indexPath, "..", OLD_INDEX_FILENAME),
        });
      } else {
        paths.push(convertedPaths);
      }
    });
  }

  const files = [];
  for (const path of paths) {
    const content = await fs.readFile(
      pathModule.join("..", path.webpack),
      "utf8"
    );
    files.push([path.monaco, content]);
  }

  // Don't use old index file name if there is only one file
  if (files.length === 1) {
    files[0][0] = files[0][0].replace(OLD_INDEX_FILENAME, "index.d.ts");
  }
  console.log({ name, fileCount: files.length });

  const packageOutPath = pathModule.join(PACKAGES_PATH, name);
  try {
    await fs.mkdir(packageOutPath, { recursive: true });
  } catch {
  } finally {
    await fs.writeFile(
      pathModule.join(packageOutPath, "declaration.json"),
      JSON.stringify(files)
    );
  }
}

/**
 * Get the type declaration root file from `package.json`.
 *
 * @param {string} path
 * @returns the index path
 */
async function getIndexPath(path) {
  const getTypesPath = async (path) => {
    try {
      const packageJSON = JSON.parse(
        await fs.readFile(pathModule.join(path, "package.json"))
      );
      if (packageJSON.types) {
        return pathModule.join(path, packageJSON.types);
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

  // Monaco has problems with '@' in the path
  const monaco = webpack.slice(1).replace("@", "").replace("//", "/");

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
