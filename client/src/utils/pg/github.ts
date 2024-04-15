import { PgCommon } from "./common";
import { PgExplorer, TupleFiles } from "./explorer";
import { PgFramework } from "./framework";
import { GithubError } from "../../constants";
import type { Arrayable } from "./types";

type GithubRepositoryData = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
} & (
  | {
      type: "file";
      download_url: string;
    }
  | {
      type: "dir";
      download_url: null;
    }
);

export class PgGithub {
  /**
   * Get whether the given URL is a GitHub URL.
   *
   * @param url URL to check
   * @returns whether the URL is a GitHub URL
   */
  static isValidUrl(url: string) {
    return /^(https:\/\/)?(www\.)?github\.com\/.+?\/.+/.test(url);
  }

  /**
   * Parse the given URL to get owner, repository name, ref, and path.
   *
   * @param url GitHub URL
   * @returns the parsed URL
   */
  static parseUrl(url: string) {
    // https://github.com/solana-labs/solana-program-library/tree/master/token/program
    const regex =
      /(https:\/\/)?(github\.com\/)([\w-]+)\/([\w-]+)(\/)?((tree|blob)\/([\w-.]+))?(\/)?([\w-/.]*)/;
    const res = regex.exec(url);
    if (!res) throw new Error(GithubError.INVALID_URL);

    const owner = res[3]; // solana-labs
    const repo = res[4]; // solana-program-library
    const ref = res.at(8); // master or `undefined` on root e.g. https://github.com/coral-xyz/xnft
    const path = res[10]; // token/program
    return { owner, repo, ref, path };
  }

  /**
   * Create a new workspace from the given GitHub URL.
   *
   * @param url GitHub URL
   */
  static async import(url: string) {
    // Check whether the repository already exists in user's workspaces
    const { owner, repo, path } = this.parseUrl(url);
    const githubWorkspaceName = `github-${owner}/${repo}/${path}`;

    if (PgExplorer.allWorkspaceNames?.includes(githubWorkspaceName)) {
      // Switch to the existing workspace
      await PgExplorer.switchWorkspace(githubWorkspaceName);
    } else {
      // Create a new workspace
      const convertedFiles = await this.getFiles(url);
      await PgExplorer.newWorkspace(githubWorkspaceName, {
        files: convertedFiles,
        skipNameValidation: true,
      });
    }
  }

  /**
   * Get the files from the given repository and map them to `TupleFiles`.
   *
   * @param url GitHub URL
   * @returns explorer files
   */
  static async getFiles(url: string) {
    const { files } = await this._getRepository(url);
    const convertedFiles = await PgFramework.convertToPlaygroundLayout(files);
    return convertedFiles;
  }

  /**
   * Get Github repository data and map the files to `TupleFiles`.
   *
   * @param url Github link to the program's folder in the repository
   * @returns files, owner, repo, path
   */
  private static async _getRepository(url: string) {
    const { data, owner, repo, path } = await this._getRepositoryData(url);

    const files: TupleFiles = [];
    const recursivelyGetFiles = async (
      dirData: GithubRepositoryData[],
      currentUrl: string
    ) => {
      // TODO: Filter `dirData` to only include the files we could need
      // Fetching all files one by one and just returning them without dealing
      // with any of the framework related checks is great here but it comes
      // with the cost of using excessive amounts of network requests to fetch
      // bigger repositories. This is especially a problem if the repository we
      // are fetching have unrelated files in their program workspace folder.
      for (const itemData of dirData) {
        if (itemData.type === "file") {
          // Skip fetching the content if the language is not supported
          if (!PgExplorer.getLanguageFromPath(itemData.path)) continue;

          const content = await PgCommon.fetchText(itemData.download_url!);
          files.push([itemData.path, content]);
        } else if (itemData.type === "dir") {
          const insideDirUrl = PgCommon.joinPaths(currentUrl, itemData.name);
          const { data: insideDirData } = await this._getRepositoryData(
            insideDirUrl
          );
          await recursivelyGetFiles(insideDirData, insideDirUrl);
        }
      }
    };
    await recursivelyGetFiles(data, url);

    return { files, owner, repo, path };
  }

  /**
   * Get GitHub repository data.
   *
   * @param url GitHub link to the program's folder in the repository
   * @returns GitHub repository data, owner, repo, path
   */
  private static async _getRepositoryData(url: string) {
    const { owner, repo, ref, path } = this.parseUrl(url);
    const refParam = ref ? `?ref=${ref}` : "";

    // If it's a single file fetch request, Github returns an object instead of an array
    const data: Arrayable<GithubRepositoryData> = await PgCommon.fetchJSON(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}${refParam}`
    );

    return { data: PgCommon.toArray(data), owner, repo, path };
  }
}
