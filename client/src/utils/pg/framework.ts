import { PgCommon } from "./common";
import { PgExplorer, TupleFiles } from "./explorer";

export class PgFramework {
  /** All frameworks */
  static frameworks: Framework[];

  /**
   * Get the current framework.
   *
   * @returns the current framework
   */
  static async getCurrent() {
    for (const framework of this.frameworks) {
      const isCurrent = await framework.getIsCurrent(PgExplorer.files);
      if (isCurrent) return framework;
    }
  }

  /**
   * Export the current workspace as a zip file based on the current framework
   * layout.
   *
   * @param opts options
   * - `convert`: whether to convert the playground layout to the framework's layout
   * @returns README Markdown text if conversion is true
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

    // Convert to framework layout
    let readme: string | undefined;
    if (opts?.convert) {
      const framework = await this.getCurrent();
      const { convertFromPlayground, readme: _readme } =
        await framework!.importFromPlayground();
      readme = _readme;
      files = await convertFromPlayground(files);
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

    const { default: saveAs } = await import("file-saver");
    saveAs(blob, PgExplorer.currentWorkspaceName + ".zip");

    return { readme };
  }
}
