import * as monaco from "monaco-editor";

import { withCargoLock } from "../../../../../../frameworks/anchor/cargo";
import { PgCommon, PgExplorer } from "../../../../../../utils";

/** Files sent to the server: `[relative path, content]` pairs */
export type Files = Array<[string, string]>;

/** What the server answers to the `open` frame */
export interface WorkspaceInfo {
  /** URI of the project root on the server, e.g. `file:///home/solpg` */
  rootUri: string;
  /** Program directory relative to the root, e.g. `programs/program` */
  programPath: string;
  /** Name of the build template the session runs on, e.g. `anchor-1.1.2` */
  template: string;
}

/**
 * Path mapping between the explorer and the language server.
 *
 * Explorer paths are full paths like `/my-project/src/lib.rs`. The server sees
 * the project as `<rootUri>/<programPath>/src/lib.rs`.
 */
export class Workspace {
  /** URI prefix of the program directory, with a trailing slash */
  private readonly _programUri: string;

  constructor(info: WorkspaceInfo) {
    this._programUri = PgCommon.appendSlash(
      PgCommon.joinPaths(info.rootUri, info.programPath)
    );
  }

  /** Get whether the explorer path is a Rust source file of the project. */
  static isProjectSource(path: string) {
    return (
      path.startsWith(PgExplorer.getCurrentSrcPath()) && path.endsWith(".rs")
    );
  }

  /** Get all project files the server needs, relative to the project root. */
  static getFiles(): Files {
    const root = PgExplorer.getProjectRootPath();
    const files: Files = [];
    for (const path in PgExplorer.files) {
      const isSource = Workspace.isProjectSource(path);
      const isManifest =
        path === PgCommon.joinPaths(root, "Cargo.toml") ||
        path === PgCommon.joinPaths(root, "Cargo.lock");
      if (!isSource && !isManifest) continue;

      const content = PgExplorer.files[path].content;
      if (content === undefined) continue;
      files.push([PgExplorer.toRelativePath(path), content]);
    }
    return withCargoLock(files);
  }

  /** Explorer full path -> server document URI */
  toUri(path: string) {
    return this._programUri + PgExplorer.toRelativePath(path);
  }

  /** Server document URI -> explorer full path (`null` if outside the project) */
  toPath(uri: string) {
    if (!uri.startsWith(this._programUri)) return null;
    const relativePath = decodeURIComponent(uri.slice(this._programUri.length));
    return PgExplorer.toAbsolutePath(relativePath);
  }

  /** Server document URI -> Monaco model URI (`null` if outside the project) */
  toModelUri = (uri: string) => {
    const path = this.toPath(uri);
    return path ? monaco.Uri.parse(path) : null;
  };

  /** Server document URI -> existing Monaco model, if any */
  getModel(uri: string) {
    const modelUri = this.toModelUri(uri);
    return modelUri ? monaco.editor.getModel(modelUri) : null;
  }
}
