// Generate TypeScript declarations for the supported packages.

import * as fs from "fs/promises";
import pathModule from "path";

/** Renamed index file name(for re-exporting) */
const OLD_INDEX_FILENAME = "old-index.d.ts";

/** All supported packages */
const packages = JSON.parse(
  await fs.readFile(pathModule.join("..", "..", "supported-packages.json"))
);

for (const name of packages) {
  console.log({ name });

  // Get all declaration file paths
  const paths = [];

  const getPaths = (path) => {
    const webpack = path.replace(/^.*node_modules\//, "/node_modules/");

    // Monaco has problems with @ in the path
    const monaco = webpack.slice(1).replace("@", "").replace("//", "/");

    return { webpack, monaco };
  };

  const packagePath = pathModule.join("..", "node_modules", name);
  let indexPath = await getIndexPath(packagePath);
  if (!indexPath) {
    const path =
      packagePath.replace(
        "node_modules",
        pathModule.join("node_modules", "@types", "node")
      ) + ".d.ts";
    paths.push(getPaths(path));
  } else {
    // Parent of `indexPath`, // "../node_modules/@coral-xyz/anchor/dist/cjs"
    const typeRootPath = pathModule.join(indexPath, "..");
    await recursivelyReadDir(typeRootPath, (path) => {
      const adjustedPaths = getPaths(path);

      if (path === indexPath) {
        // Rename the index to the project name and re-export it from a new index.d.ts
        indexPath = adjustedPaths.monaco;

        paths.unshift({
          ...adjustedPaths,
          monaco:
            adjustedPaths.monaco.substring(
              0,
              adjustedPaths.monaco.length - path.split("/").pop().length
            ) + OLD_INDEX_FILENAME,
        });
      } else {
        paths.push(adjustedPaths);
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
  if (files.length === 1) {
    files[0][0] = files[0][0].replace(OLD_INDEX_FILENAME, "index.d.ts");
  }

  const packagesDirPath = pathModule.join("..", "public", "packages");
  const packageDir = pathModule.join(packagesDirPath, name);
  try {
    await fs.mkdir(packageDir, { recursive: true });
  } catch {
  } finally {
    await fs.writeFile(
      pathModule.join(packageDir, "declaration.json"),
      JSON.stringify(files)
    );
  }
}

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
