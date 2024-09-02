import { DefaultCandyGuardSettings } from "@metaplex-foundation/js";

import { getMetaplex, loadCache, printWithStyle } from "../../utils";
import { Emoji } from "../../../../constants";
import { PgCommon, PgTerminal, PgWeb3 } from "../../../../utils/pg";

export const processGuardShow = async (
  rpcUrl: string | undefined,
  candyGuard: string | undefined
) => {
  const term = await PgTerminal.get();

  term.println(`[1/1] ${Emoji.LOOKING_GLASS} Loading candy guard`);

  // The candy guard id specified takes precedence over the one from the cache
  const candyGuardPkStr = candyGuard ?? (await loadCache()).program.candyGuard;
  if (!candyGuardPkStr) {
    throw new Error("Missing candy machine guard id.");
  }
  let candyGuardPk;
  try {
    candyGuardPk = new PgWeb3.PublicKey(candyGuardPkStr);
  } catch {
    throw new Error(
      `Failed to parse candy machine guard id: ${candyGuardPkStr}`
    );
  }

  const metaplex = await getMetaplex(rpcUrl);

  const candyGuardAccount = await metaplex
    .candyMachines()
    .findCandyGuardByAddress({ address: candyGuardPk });

  term.println(
    `\n${Emoji.GUARD} ${PgTerminal.secondaryText(
      "Candy Guard ID:"
    )} ${candyGuardPkStr}`
  );

  // Candy guard configuration
  term.println(` ${PgTerminal.secondaryText(":")}`);
  printWithStyle("", "base", candyGuardAccount.baseAddress.toBase58());
  printWithStyle("", "bump", candyGuardAccount.address.bump);
  printWithStyle(
    "",
    "authority",
    candyGuardAccount.authorityAddress.toBase58()
  );
  printWithStyle("", "data");

  // Default guard set
  printWithStyle("    ", "default");
  printGuardSet(candyGuardAccount.guards, "    :   ");

  // Groups
  if (Object.keys(candyGuardAccount.groups).length) {
    term.println(`     ${PgTerminal.secondaryText(":")}`);
    printWithStyle("    ", "groups");
    const groups = candyGuardAccount.groups;

    for (const i in groups) {
      if (i !== "0") {
        // Padding between groups
        term.println(`          ${PgTerminal.secondaryText(":")}`);
      }
      const group = groups[i];
      printWithStyle("         ", "label", group.label);
      printGuardSet(
        group.guards,
        +i === groups.length - 1 ? "             " : "         :   "
      );
    }
  } else {
    printWithStyle("    ", "groups", "none");
  }
};

const printGuardSet = (
  guardSet: DefaultCandyGuardSettings,
  padding: string
) => {
  const innerPadding = `${padding}:   `;

  // Bot tax
  if (guardSet.botTax) {
    printWithStyle(padding, "bot tax");
    printWithStyle(
      innerPadding,
      "lamports",
      `${guardSet.botTax.lamports.basisPoints.toString()} (${Emoji.SOL} ${
        guardSet.botTax.lamports.basisPoints.toNumber() /
        PgWeb3.LAMPORTS_PER_SOL
      })`
    );
    printWithStyle(
      innerPadding,
      "last instruction",
      guardSet.botTax.lastInstruction
    );
  } else {
    printWithStyle(padding, "bot tax", "none");
  }

  // Sol payment
  if (guardSet.solPayment) {
    printWithStyle(padding, "sol payment");
    printWithStyle(
      innerPadding,
      "lamports",

      `${guardSet.solPayment.amount.basisPoints.toString()} (${Emoji.SOL} ${
        guardSet.solPayment.amount.basisPoints.toNumber() /
        PgWeb3.LAMPORTS_PER_SOL
      })`
    );
    printWithStyle(
      innerPadding,
      "destination",
      guardSet.solPayment.destination.toBase58()
    );
  } else {
    printWithStyle(padding, "sol payment", "none");
  }

  // Token payment
  if (guardSet.tokenPayment) {
    printWithStyle(padding, "token payment");
    printWithStyle(
      innerPadding,
      "amount",
      guardSet.tokenPayment.amount.basisPoints.toNumber() /
        10 ** guardSet.tokenPayment.amount.currency.decimals
    );
    printWithStyle(
      innerPadding,
      "token mint",
      guardSet.tokenPayment.mint.toBase58()
    );
  } else {
    printWithStyle(padding, "token payment", "none");
  }

  // Start date
  if (guardSet.startDate) {
    printWithStyle(padding, "start date");
    printWithStyle(
      innerPadding,
      "date",
      PgCommon.getFormattedDateFromUnixTimestamp(
        guardSet.startDate.date.toNumber()
      )
    );
  } else {
    printWithStyle(padding, "start date", "none");
  }

  // Third party signer
  if (guardSet.thirdPartySigner) {
    printWithStyle(padding, "third party signer");
    printWithStyle(
      innerPadding,
      "signer key",
      guardSet.thirdPartySigner.signerKey.toBase58()
    );
  } else {
    printWithStyle(padding, "third party signer", "none");
  }

  // Token gate
  if (guardSet.tokenGate) {
    printWithStyle(padding, "token gate");
    printWithStyle(
      innerPadding,
      "amount",
      guardSet.tokenGate.amount.basisPoints.toNumber() /
        10 ** guardSet.tokenGate.amount.currency.decimals
    );
    printWithStyle(innerPadding, "mint", guardSet.tokenGate.mint.toBase58());
  } else {
    printWithStyle(padding, "token gate", "none");
  }

  // Gatekeeper
  if (guardSet.gatekeeper) {
    printWithStyle(padding, "gatekeeper");
    printWithStyle(
      innerPadding,
      "gatekeeper network",
      guardSet.gatekeeper.network
    );
    printWithStyle(
      innerPadding,
      "expire on use",
      guardSet.gatekeeper.expireOnUse
    );
  } else {
    printWithStyle(padding, "gatekeeper", "none");
  }

  // End date
  if (guardSet.endDate) {
    printWithStyle(padding, "end date");
    printWithStyle(
      innerPadding,
      "date",
      PgCommon.getFormattedDateFromUnixTimestamp(
        guardSet.endDate.date.toNumber()
      )
    );
  } else {
    printWithStyle(padding, "end date", "none");
  }

  // Allow list
  if (guardSet.allowList) {
    printWithStyle(padding, "allow list");
    printWithStyle(
      innerPadding,
      "merkle root",
      PgCommon.decodeBytes(guardSet.allowList.merkleRoot)
    );
  } else {
    printWithStyle(padding, "allow list", "none");
  }

  // Mint limit
  if (guardSet.mintLimit) {
    printWithStyle(padding, "mint limit");
    printWithStyle(innerPadding, "id", guardSet.mintLimit.id);
    printWithStyle(innerPadding, "amount", guardSet.mintLimit.limit);
  } else {
    printWithStyle(padding, "mint limit", "none");
  }

  // Nft payment
  if (guardSet.nftPayment) {
    printWithStyle(padding, "nft payment");
    printWithStyle(
      innerPadding,
      "required collection",
      guardSet.nftPayment.requiredCollection.toBase58()
    );
    printWithStyle(
      innerPadding,
      "destination",
      guardSet.nftPayment.destination.toBase58()
    );
  } else {
    printWithStyle(padding, "nft payment", "none");
  }

  // Redeemed amount
  if (guardSet.redeemedAmount) {
    printWithStyle(padding, "redeemed amount");
    printWithStyle(
      innerPadding,
      "amount",
      guardSet.redeemedAmount.maximum.toString()
    );
  } else {
    printWithStyle(padding, "redeemed amount", "none");
  }

  // Address gate
  if (guardSet.addressGate) {
    printWithStyle(padding, "address gate");
    printWithStyle(
      innerPadding,
      "address",
      guardSet.addressGate.address.toBase58()
    );
  } else {
    printWithStyle(padding, "address gate", "none");
  }

  // Nft gate
  if (guardSet.nftGate) {
    printWithStyle(padding, "nft gate");
    printWithStyle(
      innerPadding,
      "required collection",
      guardSet.nftGate.requiredCollection.toBase58()
    );
  } else {
    printWithStyle(padding, "nft gate", "none");
  }

  // Nft burn
  if (guardSet.nftBurn) {
    printWithStyle(padding, "nft burn");
    printWithStyle(
      innerPadding,
      "required collection",
      guardSet.nftBurn.requiredCollection.toBase58()
    );
  } else {
    printWithStyle(padding, "nft burn", "none");
  }

  // Token burn
  if (guardSet.tokenBurn) {
    printWithStyle(padding, "token burn");
    printWithStyle(
      innerPadding,
      "amount",
      guardSet.tokenBurn.amount.basisPoints.toNumber() /
        10 ** guardSet.tokenBurn.amount.currency.decimals
    );
    printWithStyle(innerPadding, "mint", guardSet.tokenBurn.mint.toBase58());
  } else {
    printWithStyle(padding, "token burn", "none");
  }
};
