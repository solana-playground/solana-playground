import { PgCommon } from "./common";
import type { Arrayable } from "./types";

/** Programing language implementation */
type LanguageImpl<N extends string> = {
  /** Language name */
  name: N;
  /** Valid file extension(s) for the language */
  extension: Arrayable<Extension>;
};

/** Programming language */
type Language<N extends string> = LanguageImpl<N> & {
  extension: Array<Extension>;
};

/** File extension to match */
type Extension = string | RegExp;

export class PgLanguage {
  /** All supported programming languages */
  static all: Language<LanguageName>[];

  /**
   * Create a programming language.
   *
   * @param lang language implementation
   * @returns the language with correct types
   */
  static create<N extends string>(lang: LanguageImpl<N>) {
    lang.extension = PgCommon.toArray(lang.extension);
    return lang as Language<N>;
  }

  /**
   * Get the langugage from the given path's extension.
   *
   * @param path item path
   * @returns the language
   */
  static getFromPath(path: string) {
    const givenExt = path.split(".").slice(1).join(".");
    return this.all.find((lang) =>
      lang.extension.some((ext) => {
        if (typeof ext === "string") return givenExt.endsWith(ext);
        return ext.test(givenExt);
      })
    );
  }

  /**
   * Get whether the given path is a regular JS/TS or test JS/TS file.
   *
   * @path file path
   * @returns whether the given file is a JavaScript-like file
   */
  static getIsPathJsLike(path: string) {
    const lang = this.getFromPath(path);
    switch (lang?.name) {
      case "JavaScript":
      case "TypeScript":
        return true;
      default:
        return false;
    }
  }
}
