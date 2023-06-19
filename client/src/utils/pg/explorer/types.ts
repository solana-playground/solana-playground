import type { TupleString } from "../types";

export interface ExplorerJSON {
  files: {
    [key: string]: ItemInfo;
  };
}

export interface FullFile extends ItemInfo {
  /** Full path to the file */
  path: string;
}

interface ItemInfo {
  /** Contents of the file */
  content?: string;
  /** Metadata about the file */
  meta?: ItemMeta;
}

export interface ItemMetaFile {
  /** [Relative path]: ItemMeta */
  [key: string]: ItemMeta;
}

export interface ItemMeta {
  /** Whether the file is the current file */
  current?: boolean;
  /** Whether the file is in tabs */
  tabs?: boolean;
  /** Editor's visible top line number */
  topLineNumber?: number;
}

export interface Folder {
  folders: string[];
  files: string[];
}

/** Array<[Path, Content]> */
export type Files = TupleString[];
