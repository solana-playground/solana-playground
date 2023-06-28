import type { TupleString } from "../types";

/** Playground explorer */
export interface Explorer {
  /** Explorer files */
  files: ExplorerFiles;
}

/** A record of paths and their item infos */
export type ExplorerFiles = Record<string, ItemInfo>;

/** `ItemInfo` with `path` property */
export interface FullFile extends ItemInfo {
  /** Full path to the file */
  path: string;
}

/** File or directory item */
interface ItemInfo {
  /** Contents of the file */
  content?: string;
  /** Metadata about the file */
  meta?: ItemMeta;
}

/** Relative path -> `ItemMeta` */
export type ItemMetaFile = Record<string, ItemMeta>;

/** Item metadata */
interface ItemMeta {
  /** Whether the file is the current file */
  current?: boolean;
  /** Whether the file is in tabs */
  tabs?: boolean;
  /** Editor's visible top line number */
  topLineNumber?: number;
}

/** Folder content */
export interface Folder {
  /** Sub file names */
  files: string[];
  /** Sub folder names */
  folders: string[];
}

/** Array<[Path, Content]> */
export type TupleFiles = TupleString[];
