import { PgCommon } from "./common";
import { PgExplorer, TupleFiles } from "./explorer";
import { PgServer } from "./server";

// TODO: Use explorer state to allow in temp projects
const fs = PgExplorer.fs;

export class PgJsPackage {
  /** Install packages as a bundle. */
  static async install() {
    const manifest = await this._getManifest();
    const lock = await this._getLock();
    const result = await PgServer.bundle({ manifest, lock });

    // Clear the existing data for fresh installs each time
    const internalRootDirPath = this._PATHS.INTERNAL_ROOT_DIR;
    const hasData = await fs.exists(internalRootDirPath);
    if (hasData) await fs.removeDir(internalRootDirPath, { recursive: true });

    // Save manifest
    await fs.writeFile(this._PATHS.MANIFEST_FILE, result.manifest);

    // Save lock file
    await fs.writeFile(this._PATHS.LOCK_FILE, result.lock);

    // Save bundle: each chunk individually to support lazy-loading
    for (const [path, content] of result.bundle) {
      await fs.writeFile(this._getInternalPath(path), content, {
        createParents: true,
      });
    }

    // Save types
    for (const [path, content] of result.types) {
      await fs.writeFile(this._getInternalPath(path), content, {
        createParents: true,
      });
    }
  }

  /**
   * Import a package.
   *
   * The packages must be installed before using {@link PgJsPackage.install}.
   *
   * @param name package name
   * @returns the imported package
   */
  static async import(name: string) {
    // TODO: Cache
    const mod = await this.importChunk(
      PgCommon.joinPaths(name, this._PATHS.BUNDLE_FILE)
    );
    const pkg = mod[this._toModuleName(name)];
    if (!pkg) throw new Error(`Failed to import: ${name}`);
    return pkg;
  }

  /**
   * Import a chunk.
   *
   * NOTE: This is also used by server-generated bundles.
   *
   * @param path chunk path
   * @returns the imported chunk
   */
  static async importChunk(path: string) {
    const chunk = await fs.readToString(this._getInternalPath(path));
    const blob = new Blob([chunk], { type: "text/javascript" });
    // TODO: Revoke the URL
    const blobUrl = URL.createObjectURL(blob);
    return await import(/* webpackIgnore: true */ blobUrl);
  }

  /**
   * Get type declarations.
   *
   * The packages must be installed before using {@link PgJsPackage.install}.
   *
   * @param name package name
   * @returns returns type declaration files and type dependencies
   */
  static async getTypes(name: string) {
    const pkgPath = this._getInternalPath(name);
    const files = await fs.readToJSON<TupleFiles>(
      PgCommon.joinPaths(pkgPath, this._PATHS.TYPES_FILE)
    );
    const dependencies = await fs.readToJSON<string[]>(
      PgCommon.joinPaths(pkgPath, this._PATHS.DEPENDENCIES_FILE)
    );
    return { files, dependencies };
  }

  /** Known package-related paths */
  private static readonly _PATHS = {
    INTERNAL_ROOT_DIR: PgCommon.joinPaths(
      PgExplorer.PATHS.WORKSPACE_DIRNAME,
      "js-packages"
    ),
    MANIFEST_FILE: "package.json",
    // TODO: Support `npm` and `pnpm`
    LOCK_FILE: "yarn.lock",
    BUNDLE_FILE: "bundle.js",
    TYPES_FILE: "types.json",
    DEPENDENCIES_FILE: "dependencies.json",
  };

  /** Get the path relative to the internal root directory. */
  private static _getInternalPath(relativePath: string) {
    return PgCommon.joinPaths(this._PATHS.INTERNAL_ROOT_DIR, relativePath);
  }

  /** Get the manifest file content (`package.json`). */
  private static async _getManifest() {
    try {
      return await fs.readToString(this._PATHS.MANIFEST_FILE);
    } catch {
      // TODO: Make this based on framework and version
      return await PgCommon.fetchText(
        "/frameworks/" + this._PATHS.MANIFEST_FILE
      );
    }
  }

  /** Get the lock file content. */
  private static async _getLock() {
    try {
      return await fs.readToString(this._PATHS.LOCK_FILE);
    } catch {
      // TODO: Make this based on framework and version
      return await PgCommon.fetchText("/frameworks/" + this._PATHS.LOCK_FILE);
    }
  }

  /**
   * Convert the given package name to a module name.
   *
   * NOTE: This must be kept in sync with the server.
   *
   * @param pkgName package name
   * @returns the module name
   */
  private static _toModuleName(pkgName: string) {
    return pkgName
      .replace("@", "")
      .replace("/", "")
      .replaceAll("-", "")
      .replaceAll("_", "")
      .replaceAll(".", "");
  }
}

// Server bundles use this to import.
//
// @ts-expect-error
window.__pgImportChunk = PgJsPackage.importChunk;
