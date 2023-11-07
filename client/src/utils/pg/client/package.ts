import { PgProgramInfo } from "../program-info";
import type { OrString } from "../types";

/** All packages that are allowed to be used in client/test code */
export type ClientPackageName =
  | "@clockwork-xyz/sdk"
  | "@coral-xyz/anchor"
  | "@metaplex-foundation/mpl-bubblegum"
  | "@metaplex-foundation/js"
  | "@metaplex-foundation/mpl-token-metadata"
  | "@project-serum/anchor"
  | "@solana/buffer-layout"
  | "@solana/spl-account-compression"
  | "@solana/spl-token"
  | "@solana/web3.js"
  | "assert"
  | "bn.js"
  | "borsh"
  | "buffer"
  | "mocha"
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
  static import(name: OrString<ClientPackageName>) {
    switch (name) {
      case "@clockwork-xyz/sdk":
        return import("@clockwork-xyz/sdk");
      case "@coral-xyz/anchor":
        return import("@coral-xyz/anchor");
      case "@metaplex-foundation/mpl-bubblegum":
        return import("@metaplex-foundation/mpl-bubblegum");
      case "@metaplex-foundation/js":
        return import("@metaplex-foundation/js");
      case "@metaplex-foundation/mpl-token-metadata":
        return import("@metaplex-foundation/mpl-token-metadata");
      case "@project-serum/anchor":
        return import("@project-serum/anchor");
      case "@solana/buffer-layout":
        return import("@solana/buffer-layout");
      case "@solana/spl-account-compression":
        return import("@solana/spl-account-compression");
      case "@solana/spl-token":
        return import("@solana/spl-token");
      case "@solana/web3.js":
        return import("@solana/web3.js");
      case "@solana/web3.js-tp":
        return import("@solana/web3.js-tp");
      case "@solana/webcrypto-ed25519-polyfill":
        return import("@solana/webcrypto-ed25519-polyfill");
      case "assert":
        return import("assert");
      case "bn.js":
        return import("bn.js");
      case "borsh":
        return import("borsh");
      case "buffer":
        return import("buffer");
      case "mocha":
        return import("mocha");
      default:
        // TODO: Remove after adding general support for local imports.
        // Add a special case for Anchor's `target/types`
        if (name.includes("target/types")) {
          if (!PgProgramInfo.idl) {
            throw new Error(
              "IDL not found, build the program to create the IDL."
            );
          }

          return { IDL: PgProgramInfo.idl };
        }

        throw new Error(
          name.startsWith(".")
            ? "File imports are not supported."
            : `Package '${name}' is not recognized.`
        );
    }
  }
}
