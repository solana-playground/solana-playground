import { PgExplorer, TupleFiles } from "./explorer";

export class PgCompression {
  /**
   * Create a ZIP archive.
   *
   * @param files files to create a ZIP
   * @returns the ZIP as a `Blob`
   */
  static async createZip(files: TupleFiles) {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const [path, content] of files) {
      const isFile = PgExplorer.getItemTypeFromName(path).file;
      if (isFile) zip.file(path, content);
      else zip.folder(path);
    }

    return await zip.generateAsync({ type: "blob" });
  }

  /**
   * Extract from a ZIP archive.
   *
   * @param file ZIP file
   * @returns the extracted files
   */
  static async extractZip(file: Blob) {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(file);
    const files: TupleFiles = [];
    for (const [path, item] of Object.entries(zip.files)) {
      const content = item.dir ? "" : await item.async("text");
      files.push([path, content]);
    }

    return files;
  }
}
