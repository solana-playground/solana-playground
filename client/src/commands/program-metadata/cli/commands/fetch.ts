import { Address, isSolanaError } from "@solana/kit";
import {
  Compression,
  Encoding,
  fetchMetadataFromSeeds,
  Seed,
  unpackAndFetchData,
  unpackDirectData,
} from "@solana-program/program-metadata";
import { Option } from "commander";
import picocolors from "picocolors";

import { programArgument, seedArgument } from "../arguments";
import { log, logErrorAndExit, logSuccess } from "../logs";
import {
  GlobalOptions,
  nonCanonicalReadOption,
  NonCanonicalReadOption,
  outputOption,
  OutputOption,
} from "../options";
import {
  CustomCommand,
  getKeyPairSigners,
  getReadonlyClient,
  writeFile,
} from "../utils";

export function setFetchCommand(program: CustomCommand): void {
  program
    .command("fetch")
    .description("Fetch the content of a metadata account for a given program.")
    .addArgument(seedArgument)
    .addArgument(programArgument)
    .addOption(nonCanonicalReadOption)
    .addOption(outputOption)
    .addOption(
      new Option("--raw", "Output raw data in hexadecimal format.").default(
        false
      )
    )
    .action(doFetch);
}

type Options = NonCanonicalReadOption & OutputOption & { raw: boolean };
async function doFetch(
  seed: Seed,
  program: Address,
  _: Options,
  cmd: CustomCommand
) {
  const options = cmd.optsWithGlobals() as GlobalOptions & Options;
  const client = await getReadonlyClient(options);
  const authority =
    options.nonCanonical === true
      ? (await getKeyPairSigners(options, client.configs))[0].address
      : options.nonCanonical
      ? options.nonCanonical
      : undefined;
  try {
    const metadataAccount = await fetchMetadataFromSeeds(client.rpc, {
      program,
      authority: authority ?? null,
      seed,
    });
    const content = options.raw
      ? unpackDirectData({
          encoding: Encoding.None,
          data: metadataAccount.data.data,
          compression: Compression.None,
        })
      : await unpackAndFetchData({ rpc: client.rpc, ...metadataAccount.data });

    if (options.output) {
      writeFile(options.output, content);
      logSuccess(
        `Metadata content saved to ${picocolors.bold(options.output)}`
      );
    } else {
      log(content);
    }
  } catch (error) {
    if (isSolanaError(error)) logErrorAndExit(error.message);
    throw error;
  }
}
