export type ClientPackageName =
  | "@clockwork-xyz/sdk"
  | "@metaplex-foundation/js"
  | "@project-serum/anchor"
  | "@solana/buffer-layout"
  | "@solana/spl-token"
  | "@solana/web3.js"
  | "assert"
  | "bn.js"
  | "borsh"
  | "buffer"
  | "solana-playground";

export class PgClientPackage {
  /**
   * Asynchronously import the given package.
   *
   * NOTE: Webpack only supports string literal imports.
   *
   * @param name package name
   * @returns the imported package
   */
  static async import(name: ClientPackageName | (string & {})) {
    switch (name) {
      case "@clockwork-xyz/sdk":
        return await import("@clockwork-xyz/sdk");
      case "@metaplex-foundation/js":
        return await import("@metaplex-foundation/js");
      case "@project-serum/anchor":
        return await import("@project-serum/anchor");
      case "@solana/buffer-layout":
        return await import("@solana/buffer-layout");
      case "@solana/spl-token":
        return await import("@solana/spl-token");
      case "@solana/web3.js":
        return await import("@solana/web3.js");
      case "assert":
        return await import("assert");
      case "bn.js":
        return await import("bn.js");
      case "borsh":
        return await import("borsh");
      case "buffer":
        return await import("buffer");
      default:
        throw new Error(
          name.startsWith(".")
            ? "File imports are not supported."
            : `Package '${name}' is not recognized.`
        );
    }
  }
}
