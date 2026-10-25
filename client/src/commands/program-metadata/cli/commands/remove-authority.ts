import { Address } from "@solana/kit";
import { Seed } from "@solana-program/program-metadata";

import { programArgument, seedArgument } from "../arguments";
import { logCommand } from "../logs";
import { GlobalOptions } from "../options";
import { CustomCommand, getCanonicalPdaDetails, getClient } from "../utils";

export function setRemoveAuthorityCommand(program: CustomCommand): void {
  program
    .command("remove-authority")
    .description(
      "Remove the additional authority on canonical metadata accounts."
    )
    .addArgument(seedArgument)
    .addArgument(programArgument)
    .action(doRemoveAuthority);
}

type Options = {};
async function doRemoveAuthority(
  seed: Seed,
  program: Address,
  _: Options,
  cmd: CustomCommand
) {
  const options = cmd.optsWithGlobals() as GlobalOptions & Options;
  const client = await getClient(options);
  const { metadata, programData } = await getCanonicalPdaDetails(
    client,
    program,
    seed
  );

  logCommand(`Removing additional authority from metadata account...`, {
    metadata,
    program,
    seed,
  });

  await client.runOrExport(
    client.programMetadata.instructions.setAuthority({
      account: metadata,
      authority: client.identity,
      newAuthority: null,
      program,
      programData,
    })
  );
}
