import { sol, toBigNumber, toOptionDateTime } from "@metaplex-foundation/js";

import { Keypair, PublicKey } from "@solana/web3.js";
import { Emoji } from "../../../../../../constants";

import { PgConnection } from "../../../../connection";
import { PgTerminal } from "../../../../terminal";
import { PgValidator } from "../../../../validator";
import { FREEZE_FEATURE_INDEX } from "../../constants";
import {
  loadConfigData,
  getMetaplex,
  loadCache,
  isFeatureActive,
  CacheProgram,
} from "../../utils";
import { checkName, checkSellerFeeBasisPoints, checkSymbol } from "../validate";

export const processDeploy = async (rpcUrl: string = PgConnection.endpoint) => {
  const term = await PgTerminal.get();

  // Load the cache file (this needs to have been created by the upload command)
  const cache = await loadCache();
  if (cache.isItemsEmpty()) {
    throw new Error(
      "No cache items found - run 'sugar upload' to create the cache file first."
    );
  }

  // Check that all metadata information are present and have the correct length
  for (const index in cache.items) {
    const item = cache.items[index];
    if (!item.name) {
      throw new Error(`Missing name in metadata index ${index}`);
    } else {
      checkName(item.name);
    }

    if (!item.metadata_link) {
      throw new Error(`Missing metadata link for cache item ${index}`);
    }
  }

  const configData = await loadConfigData();

  const candyMachineAddress = cache.program.candyMachine;

  // Check the candy machine data
  const numItems = configData.number;
  const hidden = configData.hiddenSettings ? 1 : 0;
  const collectionInCache = cache.items["-1"] ? 1 : 0;
  let itemsRedeemed = false;
  let freezeDeployed = false;

  const cacheItemsSansCollection =
    Object.keys(cache.items).length - collectionInCache;

  if (numItems !== cacheItemsSansCollection) {
    throw new Error(
      [
        `Number of items (${numItems}) do not match cache items (${cacheItemsSansCollection}).`,
        "Item number in the config should only include asset files, not the collection file.",
      ].join("")
    );
  } else {
    checkSymbol(configData.symbol);
    checkSellerFeeBasisPoints(configData.sellerFeeBasisPoints);
  }

  const totalSteps =
    2 + collectionInCache + (configData.freezeTime ? 1 : 0) - hidden;

  const metaplex = await getMetaplex(rpcUrl);
  const candyClient = metaplex.candyMachines();
  let candyPubkey = PublicKey.default;

  if (!candyMachineAddress) {
    term.println(`[1/${totalSteps}] ${Emoji.CANDY} Creating candy machine`);
  } else {
    term.println(`[1/${totalSteps}] ${Emoji.CANDY} Loading candy machine`);

    if (!PgValidator.isPubkey(candyMachineAddress)) {
      throw new Error(
        `Invalid candy machine address in cache file: ${candyMachineAddress}!,`
      );
    }
    candyPubkey = new PublicKey(candyMachineAddress);

    try {
      const candyState = await candyClient
        .findByAddress({ address: candyPubkey })
        .run();
      if (candyState.itemsMinted) {
        itemsRedeemed = true;
      }
      if (isFeatureActive(candyState.uuid, FREEZE_FEATURE_INDEX)) {
        freezeDeployed = true;
      }
    } catch {
      term.println(
        `${Emoji.WARNING} Candy machine ${candyMachineAddress} not found on-chain`
      );
      term.println(
        `${Emoji.WARNING} This can happen if the deploy transaction fails or times out`
      );
      term.println(`${Emoji.CANDY} Creating candy machine`);

      candyPubkey = PublicKey.default;
    }
  }

  if (candyPubkey.equals(PublicKey.default)) {
    term.println("Creating candy machine...");

    const candyKp = new Keypair();
    candyPubkey = candyKp.publicKey;

    let treasuryPk;
    if (configData.splToken) {
      if (configData.solTreasuryAccount) {
        throw new Error(
          "If spl-token-account or spl-token is set then sol-treasury-account cannot be set"
        );
      }

      const splToken = await import("@solana/spl-token");
      const conn = PgConnection.createConnectionFromUrl(rpcUrl);

      const tokenAccount = configData.splTokenAccount
        ? new PublicKey(configData.splTokenAccount)
        : await splToken.getAssociatedTokenAddress(
            new PublicKey(configData.splToken),
            metaplex.identity().publicKey
          );

      // Validates the mint address of the token accepted as payment
      await splToken.getMint(conn, new PublicKey(configData.splToken));

      // Validates the spl token wallet to receive proceedings from SPL token payments
      await splToken.getAccount(conn, tokenAccount);

      treasuryPk = tokenAccount;
    } else {
      if (configData.solTreasuryAccount) {
        treasuryPk = new PublicKey(configData.solTreasuryAccount);
      } else {
        treasuryPk = metaplex.identity().publicKey;
      }
    }

    // Save the candy machine pubkey to the cache _before_ attempting to deploy
    // in case the transaction doesn't confirm in time the next run should pickup the pubkey
    // and check if the deploy succeeded
    cache.program = new CacheProgram(candyPubkey);
    await cache.syncFile();

    // All good, let's create the candy machine
    await candyClient
      .create({
        candyMachine: candyKp,
        price: sol(configData.price),
        itemsAvailable: toBigNumber(configData.number),
        symbol: configData.symbol,
        sellerFeeBasisPoints: configData.sellerFeeBasisPoints,
        goLiveDate: toOptionDateTime(configData.goLiveDate),
        creators: configData.creators,
        tokenMint: configData.splToken
          ? new PublicKey(configData.splToken)
          : null,
        wallet: treasuryPk,
        gatekeeper: configData.gatekeeper,
        // whitelistMintSettings: configData.whitelistMintSettings,
        // endSettings: configData.endSettings,
        hiddenSettings: configData.hiddenSettings,
        retainAuthority: configData.retainAuthority,
        isMutable: configData.isMutable,
      })
      .run();
  }

  term.println(
    `${PgTerminal.bold("Candy machine ID:")} ${candyPubkey.toBase58()}`
  );

  console.log(itemsRedeemed, freezeDeployed);

  // Hidden Settings check needs to be the last action in this command, so that
  // we can update the hash with the final cache state.
  if (!hidden) {
    const stepNum = 2 + collectionInCache + (configData.freezeTime ? 1 : 0);
    term.println(
      `\n[${stepNum}/${totalSteps}] ${Emoji.PAPER} Writing config lines`
    );

    const configLineChunks = cache.getConfigLineChunks();
    if (!configLineChunks.length) {
      term.println(`\nAll config lines deployed.`);
    } else {
      const candy = await candyClient
        .findByAddress({ address: candyPubkey })
        .run();

      console.log(configLineChunks);

      let itemsLoaded = candy.itemsLoaded;
      await Promise.all(
        new Array(10).fill(null).map(async (_, i) => {
          for (let j = 0; ; j += 10) {
            console.log(i, j, itemsLoaded.toString());
            const currentChunk = configLineChunks[j + i];
            if (!currentChunk) break;

            await candyClient
              .insertItems({
                candyMachine: {
                  address: candyPubkey,
                  itemsAvailable: candy.itemsAvailable,
                  itemsLoaded: toBigNumber(
                    itemsLoaded.addn(
                      new Array(i)
                        .fill(null)
                        .reduce(
                          (acc, _cur, k) =>
                            acc + configLineChunks[j + k].length,
                          0
                        )
                    )
                  ),
                },
                items: currentChunk,
              })
              .run();

            itemsLoaded = toBigNumber(itemsLoaded.addn(currentChunk.length));
          }
        })
      );
    }
  } else {
    // TODO:
    // // If hidden settings are enabled, update the hash value with the new cache file
    // term.println("\nCandy machine with hidden settings deployed.");
    // term.println(`\nHidden settings hash: ${}`, hashAndUpdate(configData))
    // term.println("\nUpdating candy machine state with new hash value:\n");
    // processUpdate()
  }
};
