import { Address } from "@solana/kit";
import { fetchMaybeBuffer } from "@solana-program/program-metadata";

import { bufferArgument, fileArgument } from "../arguments";
import { logCommand, logErrorAndExit } from "../logs";
import { GlobalOptions, setWriteOptions, WriteOptions } from "../options";
import { CustomCommand, getClient, getWriteInput } from "../utils";

export function setUpdateBufferCommand(program: CustomCommand): void {
  program
    .command("update-buffer")
    .description("Update an existing buffer account.")
    .addArgument(bufferArgument)
    .addArgument(fileArgument)
    .tap(setWriteOptions)
    .action(doUpdateBuffer);
}

type Options = WriteOptions;
export async function doUpdateBuffer(
  buffer: Address,
  file: string | undefined,
  _: Options,
  cmd: CustomCommand
) {
  const options = cmd.optsWithGlobals() as GlobalOptions & Options;
  const client = await getClient(options);

  logCommand(`Updating buffer...`, { buffer });
  const [writeInput, bufferAccount] = await Promise.all([
    getWriteInput(client, file, options),
    fetchMaybeBuffer(client.rpc, buffer),
  ]);

  if (!bufferAccount.exists) {
    logErrorAndExit(`Buffer account not found: "${buffer}"`);
  }

  const currentData = bufferAccount.data.data;
  const newData = writeInput.buffer?.data.data ?? writeInput.data;
  const sizeDifference = newData.length - currentData.length;

  await client.runOrExport(
    client.programMetadata.instructions.updateBuffer({
      buffer,
      authority: client.identity,
      sizeDifference,
      sourceBuffer: writeInput.buffer,
      closeSourceBuffer: writeInput.closeBuffer,
      data: newData,
      singleExtendPerTransaction: options.singleExtendPerTx,
    })
  );
}
