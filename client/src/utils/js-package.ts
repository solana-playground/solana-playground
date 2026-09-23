import { PgCommon } from "./common";
import { PgExplorer, TupleFiles } from "./explorer";
import { PgServer } from "./server";

export class PgJsPackage {
  /** JS package event names */
  static readonly events = {
    ON_DID_UPDATE: "jspackageondidupdate",
  };

  /**
   * Update the current package.
   *
   * The name "update" is used broadly here; an update contains operations such as:
   *
   * - full installation
   * - adding a new package
   * - removing a package
   * - updating a package (upgrade and downgrade)
   *
   * @param command package manager command tokens
   */
  static async update(command?: string[]) {
    const manifest = this._getManifest();
    if (!manifest) throw new Error("Manifest (`package.json`) not found");

    const lock = this._getLock();
    const result = await PgServer.bundle({ manifest, lock, command });

    // Remove the existing data for fresh installs each time
    await this._removeInternalFiles();

    // Save manifest and lock files
    const packageFiles: TupleFiles = [
      [this._PATHS.MANIFEST_FILE, result.manifest],
      [this._PATHS.LOCK_FILE, result.lock],
    ];
    for (const file of packageFiles) await PgExplorer.saveItem(...file);

    // Save bundle: each chunk individually to support lazy-loading
    for (const file of result.bundle) await this._saveInternalFile(...file);
    for (const file of result.types) await this._saveInternalFile(...file);

    // Dispatch change event
    PgCommon.createAndDispatchCustomEvent(
      this.events.ON_DID_UPDATE,
      this.getParsedManifest()
    );
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
    const cachePath = PgExplorer.isTemporary
      ? // TODO: Make the cache path either unique or clear it on a new project
        path
      : // Make caching per-project rather than global
        PgExplorer.toAbsolutePath(this._getInternalPath(path));

    if (opts?.cache) {
      const blobUrl = this._importCache.get(cachePath);
      if (blobUrl) return await import(/* webpackIgnore: true */ blobUrl);
    }

    const chunk = await this._getInternalFile(path);
    const blob = new Blob([chunk], { type: "text/javascript" });
    // TODO: Revoke the URL
    const blobUrl = URL.createObjectURL(blob);
    this._importCache.set(cachePath, blobUrl);
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
  static async getTypes(
    name: string
  ): Promise<{ files: TupleFiles; dependencies: string[] }> {
    return await Promise.all(
      [this._PATHS.TYPES_FILE, this._PATHS.DEPENDENCIES_FILE]
        .map((path) => PgCommon.joinPaths(name, path))
        .map((path) => PgJsPackage._getInternalFile(path))
    )
      .then((all) => all.map((s) => JSON.parse(s)))
      .then(([files, dependencies]) => ({ files, dependencies }));
  }

  /**
   * Get and parse the current manifest (`package.json`).
   *
   * Only the fields defined in {@link Manifest} are checked to be valid.
   *
   * @returns the parsed manifest
   */
  static getParsedManifest() {
    const manifestStr = PgJsPackage._getManifest();
    if (!manifestStr) throw new Error("Manifest (`package.json`) not found");

    const manifest = JSON.parse(manifestStr) as Manifest;
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
  static onDidUpdate(cb: (manifest: Manifest) => unknown) {
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

  // TODO: Look into removing this and letting `PgExplorer` deal with it
  /**
   * In-memory map (path -> content) of internal files for temporary projects.
   *
   * The reason for storing these files here instead of letting `PgExplorer`
   * handle them is because `PgExplorer`'s internal state is intended to be
   * light, as those files are meant to be opened in the editor. Dependency
   * files can get extremely large, which may result in reduced performance or
   * even a full crash in a browser environment.
   */
  private static _tempFiles = new Map<string, string>();

  /** Package entrypoint path -> Blob URL */
  private static _importCache = new Map<string, string>();

  /** Get the path relative to the internal root directory. */
  private static _getInternalPath(relativePath?: string) {
    if (!relativePath) return this._PATHS.INTERNAL_ROOT_DIR;
    return PgCommon.joinPaths(this._PATHS.INTERNAL_ROOT_DIR, relativePath);
  }

  /** Get internal file content. */
  private static async _getInternalFile(path: string) {
    if (PgExplorer.isTemporary) {
      const content = this._tempFiles.get(path);
      if (!content) throw new Error(`File not found: ${path}`);
      return content;
    } else {
      return await PgExplorer.fs.readToString(this._getInternalPath(path));
    }
  }

  /** Save internal file. */
  private static async _saveInternalFile(path: string, content: string) {
    if (PgExplorer.isTemporary) {
      this._tempFiles.set(path, content);
    } else {
      await PgExplorer.fs.writeFile(this._getInternalPath(path), content, {
        createParents: true,
      });
    }
  }

  /** Remove all internal files. */
  private static async _removeInternalFiles() {
    if (PgExplorer.isTemporary) {
      this._tempFiles.clear();
    } else {
      const internalPath = this._getInternalPath();
      const hasData = await PgExplorer.fs.exists(internalPath);
      if (hasData) {
        await PgExplorer.fs.removeDir(internalPath, { recursive: true });
      }
    }
  }

  /** Get the manifest file content (`package.json`). */
  // TODO: Make this throw if non-existent?
  private static _getManifest() {
    return PgExplorer.getFileContent(this._PATHS.MANIFEST_FILE);
  }

  /** Get the lock file content. */
  // TODO: Make this throw if non-existent?
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
