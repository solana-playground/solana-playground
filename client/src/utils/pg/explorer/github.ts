import { GithubError } from "../../../constants";
import { Files, PgExplorer } from "./explorer";

interface GithubRepositoryInfo {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "dir" | "file";
}

type GithubRepositoryResponse = GithubRepositoryInfo[];

export class PgGithub {
  /**
   * Get Github repository content
   *
   * @param url Github link to the program's folder in the repository
   * @returns files, owner, repo, path
   */
  static async getImportableRepository(url: string) {
    const {
      data: repositoryData,
      owner,
      repo,
      path,
    } = await this._getRepositoryData(url);
    const { srcData, srcUrl } = await this._getSrcInfo(url, repositoryData);

    const files: Files = [];

    const recursivelyGetContent = async (
      dirData: GithubRepositoryResponse,
      _url: string
    ) => {
      for (const data of dirData) {
        if (data.type === "file") {
          const path = data.path.split("/src/")[1];
          const rawData = await this._getRawData(data.download_url!);
          files.push([path, rawData]);
        } else if (data.type === "dir") {
          const afterSrc = data.path.split("/src/")[1];
          _url =
            PgExplorer.appendSlash(srcUrl) + PgExplorer.appendSlash(afterSrc);
          const { data: insideDirData } = await this._getRepositoryData(_url);
          await recursivelyGetContent(insideDirData, _url);
        }
      }
    };

    await recursivelyGetContent(srcData, srcUrl);

    return { files, owner, repo, path };
  }

  /**
   * Get Github repository content
   *
   * @param url Github link to the program's folder in the repository
   * @returns Github repository response
   */
  private static async _getRepositoryData(url: string) {
    // https://github.com/solana-labs/solana-program-library/tree/master/token/program
    const regex = new RegExp(
      /(https:\/\/)?(github\.com\/)([\w-]+)\/([\w-]+)(\/)?(tree\/\w+)?(\/)?([\w-/]*)/
    );
    const res = regex.exec(url);
    if (!res) throw new Error(GithubError.INVALID_URL);
    const owner = res[3];
    const repo = res[4];
    const path = res[8].endsWith("/")
      ? res[8].substring(0, res[8].length - 1)
      : res[8];

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    );
    const data: GithubRepositoryResponse = await response.json();

    return { data, owner, repo, path };
  }

  /**
   * Get data about the program src folder
   *
   * @param url Github url to the program root
   * @param data Existing GithubRepositoryResponse
   * @returns src folder data and url
   */
  private static async _getSrcInfo(
    url: string,
    data: GithubRepositoryResponse
  ): Promise<{ srcData: GithubRepositoryResponse; srcUrl: string }> {
    // Option 1: program root folder(Cargo.toml)
    const hasSrc = data.some((d) => d.name === "src" && d.type === "dir");
    if (hasSrc) {
      // Get src folder content
      const srcUrl = `${url}/src`.replaceAll("//", "/");
      const { data: srcData } = await this._getRepositoryData(srcUrl);
      return { srcData, srcUrl };
    } else {
      // Option 2: src folder
      const hasLibRs = data.some((d) => d.name === "lib.rs");
      if (!hasLibRs) {
        const hasLibPy = data.some((d) => d.name === "lib.py");
        if (!hasLibPy) {
          throw new Error(GithubError.INVALID_REPO);
        }
      }

      return { srcData: data, srcUrl: url };
    }
  }

  private static async _getRawData(url: string) {
    const rawData = await fetch(url);
    return await rawData.text();
  }
}
