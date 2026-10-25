import { AccountRole, Address, TransactionMessage } from "@solana/kit";
import { Encoding, decodeData } from "@solana-program/program-metadata";
import picocolors from "picocolors";

import { console } from "./platform";
import type { ExportEncoding } from "./options";

export function log(message: string): void {
  console.log(message);
}

export function logSuccess(message: string): void {
  log(picocolors.green(`[Success] `) + message);
}

export function logWarning(message: string): void {
  log(picocolors.yellow(`[Warning] `) + message);
}

export function logErrorAndExit(message: string): never {
  throw new Error(message);
}

export function logTable(...args: Parameters<typeof console["table"]>) {
  console.table(...args);
}

export function logCommand(
  message: string,
  data: Record<string, string | undefined> = {}
): void {
  log("");
  log(picocolors.bold(picocolors.blue(message)));
  const entries = Object.entries(data).filter(
    ([_, value]) => value !== undefined
  );
  if (entries.length > 0) {
    log(
      entries
        .map(([key, value], i) => {
          const prefix = i === entries.length - 1 ? "└─" : "├─";
          return ` ${picocolors.blue(prefix + " " + key)}: ${value}`;
        })
        .join("\n")
    );
  }
  log("");
}

export function logExports(
  transactionLength: number,
  options: { export: Address | boolean; exportEncoding: ExportEncoding }
): void {
  const transactionPluralized =
    transactionLength === 1 ? "transaction" : "transactions";
  const forAuthority =
    typeof options.export === "string"
      ? ` for ${picocolors.bold(options.export)}`
      : "";
  const suffix =
    options.exportEncoding === "instruction-list"
      ? "as an instruction list"
      : `in ${
          {
            [Encoding.None]: "hexadecimal",
            [Encoding.Utf8]: "UTF-8",
            [Encoding.Base58]: "Base58",
            [Encoding.Base64]: "Base64",
          }[options.exportEncoding]
        }`;
  const message = `Exporting ${transactionLength} ${transactionPluralized}${forAuthority} ${suffix}:\n`;
  log(picocolors.yellow(message));
}

export function logInstructions(message: TransactionMessage): void {
  message.instructions.forEach((ix, i) => {
    log(picocolors.cyan(`\n------ IX #${i + 1} ------\n`));
    log(`${ix.programAddress}\n`);

    (ix.accounts ?? []).forEach((account) => {
      const isWritable =
        account.role === AccountRole.WRITABLE ||
        account.role === AccountRole.WRITABLE_SIGNER;
      const isSigner =
        account.role === AccountRole.READONLY_SIGNER ||
        account.role === AccountRole.WRITABLE_SIGNER;
      const writable = isWritable ? "W" : "";
      const signer = isSigner ? "S" : "";
      log(
        `${String(account.address).padEnd(44)} ${writable.padStart(
          2
        )} ${signer.padStart(1)}`
      );
    });

    log("");

    if (ix.data && ix.data.length > 0) {
      log(`${decodeData(ix.data, Encoding.Base58)}\n`);
    }
  });
}
