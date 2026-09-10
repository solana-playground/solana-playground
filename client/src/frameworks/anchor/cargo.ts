import type { TupleFiles } from "../../utils";

/**
 * Root `cargo` files of new Anchor projects, byte-identical to the server's
 * `anchor-1.1.2` build template (the server selects the build image by
 * comparing them).
 */
export const CARGO_FILES = {
  toml: require("./files/Cargo.toml") as string,
  lock: require("./Cargo.lock.raw") as string,
};

/**
 * Append the canonical `Cargo.lock` when the files carry a root `Cargo.toml`
 * without one.
 *
 * The lock is not kept as a project file — it is machinery the server needs
 * for template selection, not something to show in the explorer.
 */
export const withCargoLock = (files: TupleFiles): TupleFiles => {
  const manifest = files.find(([path]) => /^\/?Cargo\.toml$/.test(path));
  const lock = files.find(([path]) => /^\/?Cargo\.lock$/.test(path));
  if (!manifest || lock) return files;

  const prefix = manifest[0].startsWith("/") ? "/" : "";
  return [...files, [`${prefix}Cargo.lock`, CARGO_FILES.lock]];
};
