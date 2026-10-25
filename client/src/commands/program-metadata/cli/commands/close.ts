import { Address } from "@solana/kit";
import { Seed } from "@solana-program/program-metadata";

import { programArgument, seedArgument } from "../arguments";
import { logCommand } from "../logs";
import {
  GlobalOptions,
  NonCanonicalWriteOption,
  nonCanonicalWriteOption,
} from "../options";
import { CustomCommand, getClient, getPdaDetailsForWriting } from "../utils";

export function setCloseCommand(program: CustomCommand): void {
  program
    .command("close")
    .description("Close metadata account and recover rent.")
    .addArgument(seedArgument)
    .addArgument(programArgument)
    .addOption(nonCanonicalWriteOption)
    .action(doClose);
}

type Options = NonCanonicalWriteOption;
async function doClose(
  seed: Seed,
  program: Address,
  _: Options,
  cmd: CustomCommand
) {
  const options = cmd.optsWithGlobals() as GlobalOptions & Options;
  const client = await getClient(options);
  const { metadata, programData } = await getPdaDetailsForWriting(
    client,
    options,
    program,
    seed
  );

  logCommand(`Closing metadata account...`, {
    metadata,
    program,
    seed,
    authority: client.identity.address,
  });

  await client.runOrExport(
    client.programMetadata.instructions.close({
      account: metadata,
      authority: client.identity,
      program,
      programData,
      destination: client.payer.address,
    })
  );
}
