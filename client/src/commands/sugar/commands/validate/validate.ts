import type { JsonMetadata } from "@metaplex-foundation/js";

import {
  checkCategory,
  checkCreatorsAddresses,
  checkCreatorsShares,
  checkName,
  checkSellerFeeBasisPoints,
  checkSymbol,
  checkUrl,
} from "./parser";
import { SugarUploadScreen } from "../upload";
import { Emoji } from "../../../../constants";
import { PgCommon, PgView, PgTerminal } from "../../../../utils/pg";

export const processValidate = async (
  strict: boolean,
  skipCollectionPrompt: boolean
) => {
  const term = await PgTerminal.get();

  term.println(`[1/1] ${Emoji.ASSETS} Loading assets`);

  const files: File[] | null = await PgView.setModal(SugarUploadScreen, {
    title: "Validate Assets",
  });
  if (!files) throw new Error("You haven't selected files.");
  // Sort files based on their name
  files.sort((a, b) => a.name.localeCompare(b.name));
  // Get file names
  const fileNames = files.map((f) => f.name);

  // Collection should be one the last indices if it exists
  const collectionExists =
    fileNames[fileNames.length - 1] === "collection.json" ||
    fileNames[fileNames.length - 2] === "collection.json";

  if (!skipCollectionPrompt) {
    if (!collectionExists) {
      term.println(
        PgTerminal.warning(
          [
            "+----------------------------------------------+",
            `| ${Emoji.WARNING} MISSING COLLECTION FILES IN ASSETS FOLDER |`,
            "+----------------------------------------------+",
          ].join("\n")
        )
      );
      term.println(
        PgTerminal.italic(
          [
            "Check https://docs.metaplex.com/developer-tools/sugar/guides/preparing-assets for",
            "the collection file requirements if you want a collection to be set automatically.",
          ].join(" ")
        )
      );

      if (
        !(await term.waitForUserInput(
          "Do you want to continue without automatically setting the candy machine collection?",
          { confirm: true, default: "yes" }
        ))
      ) {
        throw new Error("Operation aborted");
      }

      term.println("");
    }
  }

  // Check file names start from 0
  const firstFileNumber = getNameWithoutExtension(fileNames[0]);
  if (firstFileNumber !== "0") {
    throw new Error(`File names must start from 0. (${fileNames[0]})`);
  }

  // Validate continuous assets in directory
  for (const i in fileNames.slice(
    0,
    collectionExists ? -2 : fileNames.length - 1
  )) {
    const number = getNameWithoutExtension(fileNames[i]);
    // Check is number
    if (!PgCommon.isInt(number)) {
      throw new Error(
        `File names must be numbers. ${PgTerminal.secondaryText(
          `(${fileNames[i]})`
        )}`
      );
    }

    // Check is sequential
    if (i === "0") continue;

    const lastItemNumber = getNameWithoutExtension(fileNames[+i - 1]);
    if (lastItemNumber !== number && +lastItemNumber + 1 !== +number) {
      throw new Error(
        `File names must be sequential. Jumped from ${lastItemNumber} to ${number}.`
      );
    }
  }

  // Validate metadatas
  for (const i in fileNames) {
    const fileName = fileNames[i];
    if (!fileName.endsWith(".json")) continue;

    // To be replaced with the strict validator once JSON standard is finalized
    // if (strict) {}

    const metadata: JsonMetadata = JSON.parse(await files[i].text());
    if (!metadata.name) throwNotSpecified(fileName, "name");
    checkName(metadata.name!);

    if (!metadata.image) throwNotSpecified(fileName, "image");
    checkUrl(metadata.image!);

    if (metadata.seller_fee_basis_points) {
      checkSellerFeeBasisPoints(metadata.seller_fee_basis_points);
    }
    if (metadata.symbol) {
      checkSymbol(metadata.symbol);
    }
    if (metadata.properties?.creators) {
      checkCreatorsShares(metadata.properties.creators as any);
      checkCreatorsAddresses(metadata.properties.creators as any);
    }

    if (metadata.properties?.category) {
      checkCategory(metadata.properties.category as string);
    }

    if (metadata.external_url) {
      checkUrl(metadata.external_url);
    }
  }

  term.println("Validation complete, your metadata file(s) look good.");
};

const throwNotSpecified = (fileName: string, property: string) => {
  throw new Error(
    `Metadata file ${fileName} does not have property ${PgTerminal.italic(
      `'${property}'`
    )} specified.`
  );
};

const getNameWithoutExtension = (fileName: string) => fileName.split(".")[0];
