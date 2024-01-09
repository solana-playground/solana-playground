import { PgCommon } from "./common";
import { PgExplorer, TupleFiles } from "./explorer";

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
