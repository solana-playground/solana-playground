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
   */
  static async exportWorkspace() {
    const files: TupleFiles = [];
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
    const framework = await this.getCurrent();
    const { convertFromPlayground } = await framework!.importFromPlayground();
    const frameWorkFiles = await convertFromPlayground(files);

    // Compress Zip
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    frameWorkFiles.forEach(([path, content]) => {
      const isFile = PgExplorer.getItemTypeFromName(path).file;
      if (isFile) zip.file(path, content);
      else zip.folder(path);
    });
    const blob = await zip.generateAsync({ type: "blob" });

    const { default: saveAs } = await import("file-saver");
    saveAs(blob, PgExplorer.currentWorkspaceName + ".zip");
  }
}
