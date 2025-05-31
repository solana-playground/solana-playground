import { Creator } from "@metaplex-foundation/js";

import { NULL_STRING } from "../../constants";
import { getMetaplex, loadCache, printWithStyle } from "../../utils";
import { Emoji } from "../../../../constants";
import { PgCommon, PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processShow = async (
  rpcUrl: string | undefined,
  candyMachine: string | undefined,
  unminted: boolean
) => {
  const term = await PgTerminal.get();

  term.println(
    `[1/${unminted ? "2" : "1"}] ${
      Emoji.LOOKING_GLASS
    } Looking up candy machine`
  );

  // The candy machine id specified takes precedence over the one from the cache
  const candyMachinePkStr =
    candyMachine ?? (await loadCache()).program.candyMachine;
  if (!candyMachinePkStr) {
    throw new Error("Missing candy machine id.");
  }
  let candyMachinePk;
  try {
    candyMachinePk = new PgWeb3.PublicKey(candyMachinePkStr);
  } catch {
    throw new Error(`Failed to parse candy machine id: ${candyMachinePkStr}`);
  }

  const candyClient = (await getMetaplex(rpcUrl)).candyMachines();
  const candyState = await candyClient.findByAddress({
    address: candyMachinePk,
  });

  term.println(
    `\n${Emoji.CANDY} ${PgTerminal.secondaryText(
      "Candy machine ID:"
    )} ${candyMachinePkStr}`
  );

  // Candy machine state and data
  term.println(` ${PgTerminal.secondaryText(":")}`);
  printWithStyle("", "authority", candyState.authorityAddress.toString());
  printWithStyle(
    "",
    "mint authority",
    candyState.mintAuthorityAddress.toString()
  );
  printWithStyle(
    "",
    "collection mint",
    candyState.collectionMintAddress.toString()
  );

  printWithStyle("", "max supply", candyState.maxEditionSupply.toString());
  printWithStyle("", "items redeemed", candyState.itemsMinted.toString());
  printWithStyle("", "items available", candyState.itemsAvailable.toString());

  if (candyState.featureFlags.reduce((f) => (f ? 1 : 0), 0) > 0) {
    printWithStyle("", "features", candyState.featureFlags);
  } else {
    printWithStyle("", "features", "none");
  }

  printWithStyle("", "symbol", candyState.symbol.replaceAll(NULL_STRING, ""));
  printWithStyle(
    "",
    "seller fee basis points",
    `${candyState.sellerFeeBasisPoints / 100}% (${
      candyState.sellerFeeBasisPoints
    })`
  );
  printWithStyle("", "is mutable", candyState.isMutable);
  printWithStyle("", "creators", "");

  const creators = candyState.creators;
  for (const i in creators) {
    const creator = creators[i] as Creator;
    printWithStyle(
      ":   ",
      +i + 1,
      `${creator.address} (${creator.share}%${
        creator.verified ? ", verified" : ""
      })`
    );
  }

  // Hidden settings
  const itemType = candyState.itemSettings.type;

  if (itemType === "hidden") {
    const hiddenSettings = candyState.itemSettings;
    printWithStyle("", "hidden settings", "");
    printWithStyle(":   ", "name", hiddenSettings.name);
    printWithStyle(":   ", "uri", hiddenSettings.uri);
    printWithStyle(
      ":   ",
      "hash",
      PgCommon.decodeBytes(Uint8Array.from(hiddenSettings.hash))
    );
  } else {
    printWithStyle("", "hidden settings", "none");
  }

  // Config line settings
  if (itemType === "configLines") {
    const configLineSettings = candyState.itemSettings;
    printWithStyle("", "config line settings", "");

    const prefixName = !configLineSettings.prefixName
      ? PgTerminal.secondaryText("<empty>")
      : configLineSettings.prefixName;
    printWithStyle("    ", "prefix_name", prefixName);
    printWithStyle("    ", "name_length", configLineSettings.nameLength);

    const prefixUri = !configLineSettings.prefixUri
      ? PgTerminal.secondaryText("<empty>")
      : configLineSettings.prefixUri;
    printWithStyle("    ", "prefix_uri", prefixUri);
    printWithStyle("    ", "uri_length", configLineSettings.uriLength);

    printWithStyle(
      "    ",
      "is_sequential",
      configLineSettings.isSequential ? true : false
    );
  } else {
    printWithStyle("", "config line settings", "none");
  }

  // Unminted indices
  if (unminted) {
    term.println(`\n[2/2] ${Emoji.LOOKING_GLASS} Retrieving unminted indices`);

    const indices = [];

    for (const configLine of candyState.items) {
      if (!configLine.minted) indices.push(configLine.index);
    }

    if (!indices.length) {
      term.println(
        `\n${Emoji.PAPER} ${PgTerminal.secondaryText(
          "All items of the candy machine have been minted."
        )}`
      );
    } else {
      // Makes sure all items are in order
      indices.sort();

      term.println(
        `\n${Emoji.PAPER} ${PgTerminal.bold(
          `Unminted list (${indices.length} total):`
        )}`
      );

      let current = 0;

      for (const i of indices) {
        if (!current) {
          term.println(PgTerminal.secondaryText(" :"));
          term.print(PgTerminal.secondaryText(" :.. "));
        }
        current += 1;

        if (current === 11) {
          current = 0;
          term.print(
            `${PgCommon.string(i.toString(), { addSpace: { amount: 5 } })}\n`
          );
        } else {
          term.print(
            `${PgCommon.string(i.toString(), { addSpace: { amount: 5 } })} `
          );
        }
      }

      // Just adds a new line break
      term.println("");
    }
  }
};
