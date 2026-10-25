import { Address } from "@solana/kit";
import { fetchMaybeBuffer } from "@solana-program/program-metadata";

import { bufferArgument } from "../arguments";
import { logCommand, logErrorAndExit } from "../logs";
import { GlobalOptions } from "../options";
import { addressParser } from "../parsers";
import { CustomCommand, getClient } from "../utils";

export function setCloseBufferCommand(program: CustomCommand): void {
  program
    .command("close-buffer")
    .description("Close an existing buffer account.")
    .addArgument(bufferArgument)
    .option(
      "--recipient <recipient>",
      "Address receiving the storage fees for the closed account.",
      addressParser("recipient")
    )
    .action(doCloseBuffer);
}

type Options = { recipient?: Address };
export async function doCloseBuffer(
  buffer: Address,
  _: Options,
  cmd: CustomCommand
) {
  const options = cmd.optsWithGlobals() as GlobalOptions & Options;
  const client = await getClient(options);

  logCommand(`Closing buffer...`, { buffer });
  const bufferAccount = await fetchMaybeBuffer(client.rpc, buffer);

  if (!bufferAccount.exists) {
    logErrorAndExit(`Buffer account not found: "${buffer}"`);
  }

  await client.runOrExport(
    client.programMetadata.instructions.close({
      account: buffer,
      authority: client.identity,
      destination: options.recipient ?? client.payer.address,
    })
  );
}
