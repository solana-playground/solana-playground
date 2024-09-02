import { CandyMachineItem } from "@metaplex-foundation/js";

import { CacheItem, getMetaplex, loadCache } from "../../utils";
import { Emoji } from "../../../../constants";
import { PgConnection, PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processVerify = async (rpcUrl: string | undefined) => {
  // Load the cache file (this needs to have been created by
  // the upload command)
  const cache = await loadCache();

  if (cache.isItemsEmpty()) {
    throw new Error(
      `No cache items found - run ${PgTerminal.bold(
        "'sugar upload'"
      )} to create the cache file first.`
    );
  }

  const term = await PgTerminal.get();

  term.println(`[1/2] ${Emoji.CANDY} Loading candy machine`);

  let candyMachinePk;
  try {
    candyMachinePk = new PgWeb3.PublicKey(cache.program.candyMachine);
  } catch {
    throw new Error(
      [
        `Invalid candy machine address: '${cache.program.candyMachine}'.`,
        "Check your cache file or run deploy to ensure your candy machine was created.",
      ].join(" ")
    );
  }

  const metaplex = await getMetaplex(rpcUrl);
  const candyClient = metaplex.candyMachines();
  const candyState = await candyClient.findByAddress({
    address: candyMachinePk,
  });

  term.println(`\n[2/2] ${Emoji.PAPER} Verification`);

  if (candyState.itemSettings.type === "hidden") {
    // Nothing else to do, there are no config lines in a candy machine
    // with hidden settings
    term.println("\nHidden settings enabled. No config items to verify.");
  } else {
    const numItems = candyState.itemsAvailable;

    term.println(`Verifying ${numItems.toString()} config line(s)...`);

    const errors = [];

    for (const configLine of candyState.items) {
      const cacheItem = cache.items[configLine.index];
      try {
        assertItemsMatch(cacheItem, configLine);
      } catch (e: any) {
        cacheItem.onChain = false;
        errors.push({ index: configLine.index, message: e.message });
      }
    }

    if (errors.length) {
      term.println(PgTerminal.error("Verification failed"));
      await cache.syncFile();

      term.println("\nInvalid items found:");

      for (const e of errors) {
        term.println(`- Item ${e.index}: ${e.message}`);
      }
      term.println(
        `\nCache updated - re-run ${PgTerminal.bold("'sugar deploy'")}.`
      );

      throw new Error(`${errors.length} invalid item(s) found.`);
    }
  }

  if (candyState.itemsMinted.gtn(0)) {
    term.println(
      "\nAn item has already been minted. Skipping candy machine collection verification..."
    );
  } else {
    const collectionItem = cache.items["-1"];
    const collectionNeedsDeploy = collectionItem
      ? !collectionItem.onChain
      : false;

    const collectionMetadataPk = metaplex
      .nfts()
      .pdas()
      .metadata({ mint: new PgWeb3.PublicKey(cache.program.collectionMint) });

    const metadata = await metaplex
      .nfts()
      .findByMetadata({ metadata: collectionMetadataPk });

    if (metadata.address.toBase58() !== cache.program.collectionMint) {
      term.println("\nInvalid collection state found");
      cache.program.collectionMint = metadata.address.toBase58();
      if (collectionItem) {
        collectionItem.onChain = false;
      }
      await cache.syncFile();

      term.println(
        `Cache updated - re-run ${PgTerminal.bold("'sugar deploy`")}.`
      );

      throw new Error(
        `Collection mint in cache ${
          cache.program.collectionMint
        } doesn't match on chain collection mint ${metadata.address.toBase58()}!`
      );
    } else if (collectionNeedsDeploy) {
      term.println(
        `\nInvalid collection state found - re-run ${PgTerminal.bold(
          "'sugar deploy`"
        )}.`
      );
      throw new Error("Invalid cache state found.");
    }

    const cluster = await PgConnection.getCluster(
      metaplex.connection.rpcEndpoint
    );
    if (cluster === "devnet" || cluster === "mainnet-beta") {
      term.println(
        [
          `\nVerification successful. You're good to go!\n\nSee your candy machine at:\n`,
          `  -> ${PgTerminal.underline(
            `https://www.solaneyes.com/address/${
              cache.program.candyMachine
            }?cluster=${cluster === "devnet" ? cluster : "mainnet"}`
          )}`,
        ].join(""),
        { noColor: true }
      );
    } else {
      term.println("\nVerification successful. You're good to go!");
    }
  }
};

const assertItemsMatch = (
  cacheItem: CacheItem,
  configLine: CandyMachineItem
) => {
  if (cacheItem.name !== configLine.name) {
    throw new Error(
      `name mismatch (expected='${cacheItem.name}', found='${configLine.name}')`
    );
  }
  if (cacheItem.metadata_link !== configLine.uri) {
    throw new Error(
      `uri mismatch (expected='${cacheItem.metadata_link}', found='${configLine.uri}')`
    );
  }
};
