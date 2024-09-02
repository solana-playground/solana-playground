import {
  getCmCreatorMetadataAccounts,
  getMetaplex,
  loadCache,
  loadConfigData,
} from "../../utils";
import { Emoji } from "../../../../constants";
import { PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processReveal = async (rpcUrl: string | undefined) => {
  const term = await PgTerminal.get();

  term.println(`[1/4] ${Emoji.LOOKING_GLASS} Loading items from the cache`);

  const configData = await loadConfigData();

  if (!configData.hiddenSettings) {
    throw new Error("Candy machine is not a Hidden Settings mint.");
  }

  const cache = await loadCache();

  const candyMachinePkStr = cache.program.candyMachine;
  let candyMachinePk;
  try {
    candyMachinePk = new PgWeb3.PublicKey(candyMachinePkStr);
  } catch {
    throw new Error(`Failed to parse candy machine id: ${candyMachinePkStr}`);
  }

  term.println(
    `\n[2/4] ${Emoji.LOOKING_GLASS} Getting minted NFTs for candy machine ${candyMachinePkStr}`
  );

  const metaplex = await getMetaplex(rpcUrl);
  const creatorPda = metaplex
    .candyMachines()
    .pdas()
    .authority({ candyMachine: candyMachinePk });

  const metadataAccounts = await getCmCreatorMetadataAccounts(
    metaplex,
    creatorPda.toBase58()
  );

  if (!metadataAccounts.length) {
    throw new Error(
      `No minted NFTs found for candy machine ${candyMachinePkStr}`
    );
  }

  term.println(`Found ${metadataAccounts.length} account(s)`);

  // Not necessary but keeping it just to have the same output as sugar cli
  term.println(`\n[3/4] ${Emoji.LOOKING_GLASS} Matching NFTs to cache values`);

  term.println(`\n[4/4] ${Emoji.UPLOAD} Updating NFT URIs from cache values`);

  // Show progress bar
  PgTerminal.setProgress(0.1);
  let progressCount = 0;
  let errorCount = 0;

  const CONCURRENT = 4;

  const nftNumberRegex = /#(\d+)/;
  await Promise.all(
    new Array(CONCURRENT).fill(null).map(async (_, i) => {
      for (let j = 0; j + i < metadataAccounts.length; j += CONCURRENT) {
        try {
          const nft = await metaplex
            .nfts()
            .findByMetadata({ metadata: metadataAccounts[j + i].publicKey });

          const regexResult = nftNumberRegex.exec(nft.name);
          if (!regexResult) {
            throw new Error(
              `NFT (${nft.address}) is not numbered. Your hidden settings are not set up correctly.`
            );
          }

          // Don't update if the uri is the same(re-run)
          const cacheMetadataLink =
            cache.items[`${+regexResult[1] - 1}`].metadata_link;
          if (nft.uri === cacheMetadataLink) continue;

          await metaplex.nfts().update({
            nftOrSft: nft,
            uri: cacheMetadataLink,
          });
        } catch (e: any) {
          console.log(e.message);
          errorCount++;
        } finally {
          progressCount++;
          PgTerminal.setProgress(
            (progressCount / metadataAccounts.length) * 100
          );
        }
      }
    })
  );

  // Hide progress bar
  setTimeout(() => PgTerminal.setProgress(0), 1000);

  if (errorCount) {
    term.println(
      `${PgTerminal.error(
        `${Emoji.WARNING} Some reveals failed.`
      )} ${errorCount} items failed.`
    );
    throw new Error(
      `${PgTerminal.error("Revealed")} ${
        metadataAccounts.length - errorCount
      }/${metadataAccounts.length} ${PgTerminal.error("of the items")}`
    );
  } else {
    term.println(PgTerminal.secondary(`${Emoji.CONFETTI} Reveal complete!`));
  }
};
