import type { TupleString } from "../types";

/** Playground explorer */
export interface Explorer {
  /** Explorer files */
  files: ExplorerFiles;
  /** Full path of the files in tabs */
  tabs: string[];
  /** Current file index(in tabs) */
  currentIndex: number;
}

/** Full path -> `ItemInfo` */
export type ExplorerFiles = Record<string, ItemInfo>;

/** `ItemInfo` with `path` property */
export interface FullFile extends ItemInfo {
  /** Path to the file */
  path: string;
}

/** File or directory item */
interface ItemInfo {
  /** Contents of the file */
  content?: string;
  /** Metadata about the file */
  meta?: ItemMeta;
}

/**
 * Item metadata file.
 *
 * Intentionally using an `Array` instead of a map to keep the tab order.
 */
export type ItemMetaFile = Array<
  {
    /** Relative path */
    path: string;
    /** Whether the file is in tabs */
    isTabs?: boolean;
    /** Whether the file is the current file */
    isCurrent?: boolean;
  } & ItemMeta
>;

/** Item metadata */
interface ItemMeta {
  /** Position data */
  position?: Position;
}

/** Editor position data */
export interface Position {
  /** Editor's visible top line number */
  topLineNumber: number;
  /** Editor cursor position */
  cursor: {
    /** Start index */
    from: number;
    /** End index */
    to: number;
  };
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
