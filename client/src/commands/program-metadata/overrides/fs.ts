import {
  Getable,
  PgCommon,
  PgExplorer,
  PgProgramInfo,
  PgSettings,
  PgWallet,
} from "../../../utils";
import * as os from "./os";
import * as path from "./path";

const fs = PgExplorer.fs;

const FILE_OVERRIDES: Array<[string, Getable<string>]> = [
  [
    path.join(os.homedir(), ".config", "solana", "cli", "config.yml"),
    () => `---
json_rpc_url: ${PgSettings.connection.endpoint}
commitment: ${PgSettings.connection.endpoint}
`,
  ],
  [
    path.join(os.homedir(), ".config", "solana", "id.json"),
    () => {
      if (!PgWallet.current?.isPg) {
        throw new Error(
          "This command currently requires Playground Wallet connection"
        );
      }

      return JSON.stringify(Array.from(PgWallet.current.keypair.secretKey));
    },
  ],
];

export const exists = async (path: string) => {
  if (FILE_OVERRIDES.some(([p]) => p === path)) return true;
  return await fs.exists(path);
};

export const readFile = async (path: string, encoding = "utf-8") => {
  if (encoding !== "utf-8") throw new Error("Only utf-8 encoding is supported");

  const fileOverride = FILE_OVERRIDES.find(([p]) => p === path);
  if (fileOverride) return PgCommon.callIfNeeded(fileOverride[1]);
  return await fs.readToString(path);
};

export const writeFile = fs.writeFile;

export const mkdir = async (path: string, opts?: { recursive?: boolean }) => {
  return await fs.createDir(path, { createParents: opts?.recursive });
};
