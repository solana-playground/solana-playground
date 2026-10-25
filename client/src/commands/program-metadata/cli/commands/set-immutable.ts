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

export function setSetImmutableCommand(program: CustomCommand): void {
  program
    .command("set-immutable")
    .description(
      "Make the metadata account immutable, preventing any further updates."
    )
    .addArgument(seedArgument)
    .addArgument(programArgument)
    .addOption(nonCanonicalWriteOption)
    .action(doSetImmutable);
}

type Options = NonCanonicalWriteOption;
async function doSetImmutable(
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

  logCommand(`Making metadata account immutable...`, {
    metadata,
    program,
    seed,
    authority: client.identity.address,
  });

  await client.runOrExport(
    client.programMetadata.instructions.setImmutable({
      metadata,
      authority: client.identity,
      program,
      programData,
    })
  );
}
