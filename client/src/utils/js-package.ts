import { PgCommon } from "./common";
import { PgExplorer, TupleFiles } from "./explorer";
import { PgServer } from "./server";

// TODO: Use explorer state to allow in temp projects
const fs = PgExplorer.fs;

export class PgJsPackage {
  /** JS package event names */
  static readonly events = {
    ON_DID_UPDATE: "jspackageondidupdate",
  };

  /**
   * Update the current package.
   *
   * The word "update" is used broadly here; an update contains operations such as:
   *
   * - full installation
   * - adding a new package
   * - removing a package
   * - updating a package (upgrade and downgrade)
   *
   * @param command package manager command tokens
   */
  static async update(command?: string[]) {
    const manifest = await this._getManifest();
    const lock = await this._getLock();
    const result = await PgServer.bundle({ manifest, lock, command });

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

    PgCommon.createAndDispatchCustomEvent(this.events.ON_DID_UPDATE);
  }

  /**
   * Import a package.
   *
   * The packages must be installed before using {@link PgJsPackage.update}.
   *
   * @param name package name
   * @returns the imported package
   */
  static async import(name: string) {
    const mod = await this.importChunk(
      PgCommon.joinPaths(name, this._PATHS.BUNDLE_FILE),
      { cache: true }
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
  static async importChunk(path: string, opts?: { cache?: boolean }) {
    // Make caching per-project rather than global
    path = PgExplorer.toAbsolutePath(this._getInternalPath(path));
    if (opts?.cache) {
      const blobUrl = this._importCache.get(path);
      if (blobUrl) return await import(/* webpackIgnore: true */ blobUrl);
    }

    const chunk = await fs.readToString(path);
    const blob = new Blob([chunk], { type: "text/javascript" });
    // TODO: Revoke the URL
    const blobUrl = URL.createObjectURL(blob);
    this._importCache.set(path, blobUrl);
    return await import(/* webpackIgnore: true */ blobUrl);
  }

  /**
   * Get type declarations.
   *
   * The packages must be installed before using {@link PgJsPackage.update}.
   *
   * @param name package name
   * @returns returns type declaration files and type dependencies
   */
  static async getTypes(name: string) {
    const pkgPath = this._getInternalPath(name);
    const files = await fs.readToJson<TupleFiles>(
      PgCommon.joinPaths(pkgPath, this._PATHS.TYPES_FILE)
    );
    const dependencies = await fs.readToJson<string[]>(
      PgCommon.joinPaths(pkgPath, this._PATHS.DEPENDENCIES_FILE)
    );
    return { files, dependencies };
  }

  /**
   * Get and parse the current manifest (`package.json`).
   *
   * Only the fields defined in {@link Manifest} are checked to be valid.
   *
   * @returns the parsed manifest
   */
  static async getParsedManifest() {
    const manifest = await fs.readToJson<Manifest>(this._PATHS.MANIFEST_FILE);
    const { name } = manifest;
    if (name !== undefined && typeof name !== "string") {
      throw new Error(`Invalid manifest name: ${name}`);
    }

    const depKeys = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ] as const;
    depKeys.forEach((key) => {
      const value = manifest[key];
      if (value !== undefined && typeof value !== "object") {
        throw new Error(`Invalid dependencies: ${key}: ${value}`);
      }
    });

    return manifest;
  }

  /**
   * Create a listener that runs after {@link PgJsPackage.update}.
   *
   * @param cb callback function to run
   * @returns a dispose function to clear the event
   */
  static onDidUpdate(cb: () => unknown) {
    return PgCommon.onDidChange(PgJsPackage.events.ON_DID_UPDATE, cb);
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

  /** Package entrypoint path -> Blob URL */
  private static _importCache = new Map<string, string>();

  /** Get the path relative to the internal root directory. */
  private static _getInternalPath(relativePath: string) {
    return PgCommon.joinPaths(this._PATHS.INTERNAL_ROOT_DIR, relativePath);
  }

  /** Get the manifest file content (`package.json`). */
  private static async _getManifest() {
    return await fs.readToString(this._PATHS.MANIFEST_FILE);
  }

  /** Get the lock file content. */
  private static async _getLock() {
    return await fs.readToString(this._PATHS.LOCK_FILE);
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

/** `package.json` */
interface Manifest {
  /** Project name */
  name?: string;
  /** Main dependencies */
  dependencies?: Dependencies;
  /** Development dependencies */
  devDependencies?: Dependencies;
  /** Peer dependencies */
  peerDependencies?: Dependencies;
  /** Optional dependencies */
  optionalDependencies?: Dependencies;
}

/** `package.json` dependencies map */
type Dependencies = Record<string, string>;

// Server bundles use this to import.
//
// @ts-expect-error
window.__pgImportChunk = PgJsPackage.importChunk;
