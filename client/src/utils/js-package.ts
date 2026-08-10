import { PgCommon } from "./common";
import { PgExplorer } from "./explorer";
import { PgServer } from "./server";

export class PgJsPackage {
  /** Install packages as a bundle. */
  static async install() {
    const manifest =
      this._getManifest() ??
      // TODO: Make this based on framework and version
      (await PgCommon.fetchText("/frameworks/package.json"));
    if (!manifest) throw new Error("`package.json` not found");

    const lock =
      this._getLock() ?? (await PgCommon.fetchText("/frameworks/yarn.lock"));
    const result = await PgServer.bundle({ manifest, lock });
    console.log(result);

    // TODO: Save state to allow in temp projects
    const fs = PgExplorer.fs;

    // Save manifest
    await fs.writeFile(this._PATHS.MANIFEST_FILE, result.manifest);

    // Save lock file
    if (result.lock) await fs.writeFile(this._PATHS.LOCK_FILE, result.lock);

    // Save bundle: each chunk individually to support lazy-loading
    for (const [path, content] of result.bundle) {
      await fs.writeFile(this._getInternalPath(path), content, {
        createParents: true,
      });
    }

    // TODO: Save types
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
    const mod = await this.importChunk("bundle.js");
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
    const chunk = await PgExplorer.fs.readToString(this._getInternalPath(path));
    const blob = new Blob([chunk], { type: "text/javascript" });
    // TODO: Revoke the URL
    const blobUrl = URL.createObjectURL(blob);
    return await import(/* webpackIgnore: true */ blobUrl);
  }

  /** Known package-related paths */
  private static readonly _PATHS = {
    INTERNAL_ROOT_DIR: PgCommon.joinPaths(".workspace", "js-packages"),
    MANIFEST_FILE: "package.json",
    // TODO: Support `npm` and `pnpm`
    LOCK_FILE: "yarn.lock",
  };

  /** Get the path relative to the internal root directory. */
  private static _getInternalPath(relativePath: string) {
    return PgCommon.joinPaths(this._PATHS.INTERNAL_ROOT_DIR, relativePath);
  }

  /** Get the manifest file content (`package.json`). */
  private static _getManifest() {
    return PgExplorer.getFileContent(this._PATHS.MANIFEST_FILE);
  }

  /** Get the lock file content. */
  private static _getLock() {
    return PgExplorer.getFileContent(this._PATHS.LOCK_FILE);
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
