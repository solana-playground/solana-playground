import { PgCommon } from "./common";
import { Lang, PgExplorer, TupleFiles } from "./explorer";
import type { RequiredKey, SyncOrAsync } from "./types";

/** Custom framework parameter */
export type FrameworkImpl<N extends string> = {
  /** Framework name */
  name: N;

  /** Framework program language */
  language: Lang;

  /** Image icon src */
  icon: string;

  /** Example GitHub project */
  githubExample: {
    /** Project name */
    name: string;
    /** Project GitHub URL */
    url: string;
  };

  /** Default file to open after loading the default framework files */
  defaultOpenFile?: string;

  /** Whether to make the image circular */
  circleImage?: boolean;

  /**
   * Get whether the given files have this framework's layout.
   *
   * @param files files with either playground's layout or framework's layout
   * @returns whether the given files belong to this framework
   */
  getIsCurrent: (files: TupleFiles) => SyncOrAsync<boolean>;

  /** Lazy load default framework files, defaults to `./files` */
  importFiles?: () => Promise<{
    /** Default framework files to create on a new project */
    files: TupleFiles;
  }>;

  /** Lazy load the **from** playground conversion module, defaults to `./from` */
  importFromPlayground?: () => Promise<{
    /**
     * Convert the given playground layout files to the framework's original
     * layout files.
     *
     * @param files playground layout files
     * @returns the frameworks' original layout files
     */
    convertFromPlayground: (files: TupleFiles) => SyncOrAsync<TupleFiles>;
    /** Markdown text to show after conversion */
    readme: string;
  }>;

  /** Lazy load the **to** playground conversion module, defaults to `./to` */
  importToPlayground?: () => Promise<{
    /**
     * Convert the given framework layout files to playground layout files.
     *
     * @param files framework layout files
     * @returns the playground layout files
     */
    convertToPlayground: (files: TupleFiles) => SyncOrAsync<TupleFiles>;
  }>;
};

/** Created framework */
export type Framework<N extends string = string> = RequiredKey<
  FrameworkImpl<N>,
  "getIsCurrent" | "importFiles" | "importFromPlayground" | "importToPlayground"
>;

export class PgFramework {
  /** All frameworks */
  static frameworks: Framework[];

  /**
   * Get the framework from its name.
   *
   * @param name framework name
   * @returns the framework
   */
  static get(name: FrameworkName) {
    return this.frameworks.find((f) => f.name === name)!;
  }

  /**
   * Get the framework from the given files.
   *
   * @param files files to check, defaults to current project files
   * @returns the framework
   */
  static async getFromFiles(files: TupleFiles = PgExplorer.getAllFiles()) {
    for (const framework of this.frameworks) {
      const isCurrent = await framework.getIsCurrent(files);
      if (isCurrent) return framework;
    }
  }

  /**
   * Convert files with the framework layout to the playground layout.
   *
   * @param files framework files
   * @returns the playground layout converted files
   */
  static async convertToPlaygroundLayout(files: TupleFiles) {
    const framework = await this.getFromFiles(files);
    if (!framework) throw new Error("Could not identify framework");

    const { convertToPlayground } = await framework.importToPlayground();
    const convertedFiles = await convertToPlayground(files);
    if (!convertedFiles.length) throw new Error("Could not convert files");

    return convertedFiles;
  }

  /**
   * Export the current workspace as a zip file based on the current framework
   * layout.
   *
   * @param opts options
   * - `convert`: whether to convert the playground layout to the framework's layout
   * @returns README Markdown text if `opts.convert` is true
   */
  static async exportWorkspace(opts?: { convert?: boolean }) {
    let files: TupleFiles = [];
    const recursivelyGetItems = async (path: string) => {
      const itemNames = await PgExplorer.fs.readDir(path);
      const subItemPaths = itemNames
        .filter((itemName) => !itemName.startsWith("."))
        .map((itemName) => PgCommon.appendSlash(path) + itemName);

      for (const subItemPath of subItemPaths) {
        const metadata = await PgExplorer.fs.getMetadata(subItemPath);
        if (metadata.isFile()) {
          const relativePath = PgExplorer.getRelativePath(subItemPath);
          const content = await PgExplorer.fs.readToString(subItemPath);
          files.push([relativePath, content]);
        } else {
          await recursivelyGetItems(subItemPath);
        }
      }
    };
    await recursivelyGetItems(PgExplorer.currentWorkspacePath);

    // Convert from playground layout to framework layout
    let readme: string | undefined;
    if (opts?.convert) {
      const framework = await this.getFromFiles(files);
      if (!framework) throw new Error("Could not identify framework");

      const frameworkFrom = await framework.importFromPlayground();
      readme = frameworkFrom.readme;
      files = await frameworkFrom.convertFromPlayground(files);
    }

    // Compress Zip
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    files.forEach(([path, content]) => {
      const isFile = PgExplorer.getItemTypeFromName(path).file;
      if (isFile) zip.file(path, content);
      else zip.folder(path);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    PgCommon.export(PgExplorer.currentWorkspaceName + ".zip", blob);

    return { readme };
  }
}
