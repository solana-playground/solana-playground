import { toDateTime } from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

import { ConfigData } from "../../types";
import { Emoji } from "../../../../../../constants";
import { PgConnection } from "../../../../connection";
import { PgTerminal } from "../../../../terminal";
import { PgValidator } from "../../../../validator";
import {
  EndSettingType,
  WhitelistMintMode,
} from "@metaplex-foundation/mpl-candy-machine";
import { PgExplorer } from "../../../../explorer";

const CIVIC_NETWORK = new PublicKey(
  "ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6"
);
const ENCORE_NETWORK = new PublicKey(
  "tibePmPaoTgrs929rWpu755EXaxC7M3SthVCf6GzjZt"
);

const MAX_FREEZE_DAYS = 31;

export const processCreateConfig = async (
  rpcUrl: string = PgConnection.endpoint
) => {
  PgTerminal.logWasm(`[1/2] ${Emoji.CANDY} Sugar interactive config maker`);

  PgTerminal.logWasm(
    "\nCheck out our Candy Machine config docs to learn about the options:"
  );
  PgTerminal.logWasm(
    `  -> ${PgTerminal.underline(
      "https://docs.metaplex.com/tools/sugar/configuration"
    )}\n`
  );

  const term = await PgTerminal.get();

  const configData: Partial<ConfigData> = {};

  // Price
  configData.price = parseFloat(
    await term.waitForUserInput("What is the price of each NFT?", {
      validator: PgValidator.isFloat,
    })
  );

  // Number
  configData.number = parseInt(
    await term.waitForUserInput(
      "How many NFTs will you have in your candy machine?",
      { validator: PgValidator.isInt }
    )
  );

  // Symbol
  configData.symbol = await term.waitForUserInput(
    "What is the symbol of your collection? Hit [ENTER] for no symbol.",
    {
      allowEmpty: true,
      validator: (input) => {
        if (input.length > 10) {
          throw new Error("Symbol must be 10 characters or less.");
        }
      },
    }
  );

  // Seller fee basis points
  configData.sellerFeeBasisPoints = parseInt(
    await term.waitForUserInput("What is the seller fee basis points?", {
      validator: (input) => {
        if (!PgValidator.isInt(input)) {
          throw new Error(`Couldn't parse input of '${input}' to a number.`);
        }
        if (parseInt(input) > 10_000) {
          throw new Error("Seller fee basis points must be 10,000 or less.");
        }
      },
    })
  );

  // TODO: validate
  // Date
  const date = await term.waitForUserInput(
    [
      "What is your go live date? Many common formats are supported.",
      "If unsure, try YYYY-MM-DD HH:MM:SS [+/-]UTC-OFFSET or type 'now' for current time.",
      "For example 2022-05-02 18:00:00 +0000 for May 2, 2022 18:00:00 UTC.",
    ].join(" ")
  );
  configData.goLiveDate = date === "" ? null : date;

  // Creators
  const numberOfCreators = parseInt(
    await term.waitForUserInput(
      "How many creator wallets do you have? (max limit of 4)",
      { validator: (input) => PgValidator.isInt(input) && parseInt(input) <= 4 }
    )
  );

  let totalShare = 0;
  const validateShare = (input: string, isLastCreator: boolean) => {
    if (!PgValidator.isInt(input)) {
      throw new Error(`Couldn't parse input of '${input}' to a number.`);
    }

    const newShare = parseInt(input) + totalShare;
    if (newShare > 100) {
      throw new Error("Royalty share total has exceeded 100 percent.");
    }
    if (isLastCreator && newShare !== 100) {
      throw new Error("Royalty share for all creators must total 100 percent.");
    }
  };

  configData.creators = [];
  for (let i = 0; i < numberOfCreators; i++) {
    const address = new PublicKey(
      await term.waitForUserInput(`Enter creator wallet address #${i + 1}`, {
        validator: PgValidator.isPubkey,
      })
    );
    const share = parseInt(
      await term.waitForUserInput(
        `Enter royalty percentage share for creator #${
          i + 1
        } (e.g., 70). Total shares must add to 100.`,
        {
          validator: (input) =>
            validateShare(input, i + 1 === numberOfCreators),
        }
      )
    );

    totalShare += share;
    configData.creators.push({ address, share, verified: false });
  }

  // Optional extra features
  const choices = await term.waitForUserInput(
    "Which extra features do you want to use? Leave empty for no extra features. (e.g. 0,2)",
    {
      allowEmpty: true,
      multiChoice: {
        items: [
          "SPL Token Mint", // 0
          "Gatekeeper", // 1
          "Whitelist Mint", // 2
          "End Settings", // 3
          "Hidden Settings", // 4
          "Freeze Settings", // 5
        ],
      },
    }
  );

  // SPL Token Mint
  if (choices.includes(0)) {
    configData.solTreasuryAccount = null;
    configData.splToken = await term.waitForUserInput(
      "What is your SPL token mint address?",
      {
        validator: PgValidator.isPubkey,
      }
    );
    configData.splTokenAccount = await term.waitForUserInput(
      "What is your SPL token account address (the account that will hold the SPL token mints)?",
      {
        validator: PgValidator.isPubkey,
      }
    );
  } else {
    configData.splToken = null;
    configData.splTokenAccount = null;
    configData.solTreasuryAccount = await term.waitForUserInput(
      "What is your SOL treasury address?",
      {
        validator: PgValidator.isPubkey,
      }
    );
  }

  // Gatekeeper
  if (choices.includes(1)) {
    const gatekeeperOption = await term.waitForUserInput(
      [
        "Which gatekeeper network do you want to use?",
        "Check https://docs.metaplex.com/guides/archived/candy-machine-v2/configuration#provider-networks for more info.",
      ].join(" "),
      {
        multiChoice: {
          items: [
            "Civic Pass", // 0
            "Verify by Encore", // 1
          ],
          chooseOne: true,
        },
        default: "0",
      }
    );

    const expireOnUse = await term.waitForUserInput(
      "To help prevent bots even more, do you want to expire the gatekeeper token on each mint?",
      { confirm: true }
    );

    const network = gatekeeperOption === 0 ? CIVIC_NETWORK : ENCORE_NETWORK;

    configData.gatekeeper = {
      network,
      expireOnUse,
    };
  } else {
    configData.gatekeeper = null;
  }

  // Whitelist Mint
  if (choices.includes(2)) {
    const mint = new PublicKey(
      await term.waitForUserInput("What is your WL token mint address?", {
        validator: PgValidator.isPubkey,
      })
    );

    const mode =
      (await term.waitForUserInput(
        "Do you want the whitelist token to be burned on each mint?",
        { confirm: true }
      )) === true
        ? WhitelistMintMode.BurnEveryTime
        : WhitelistMintMode.NeverBurn;

    const presale = await term.waitForUserInput(
      "Do you want to enable presale mint with your whitelist token?",
      { confirm: true }
    );

    let discountPrice = null;
    if (presale) {
      const price = await term.waitForUserInput(
        "What is the discount price for the presale? Hit [ENTER] to not set a discount price.",
        { allowEmpty: true, validator: PgValidator.isFloat }
      );
      if (price) discountPrice = parseFloat(price);
    }

    configData.whitelistMintSettings = {
      mint,
      mode,
      discountPrice,
      presale,
    };
  } else {
    configData.whitelistMintSettings = null;
  }

  // End Settings
  if (choices.includes(3)) {
    const endSettingType = await term.waitForUserInput(
      "What end settings type do you want to use?",
      {
        multiChoice: {
          items: ["Amount", "Date"],
          chooseOne: true,
        },
        default: "0",
      }
    );

    // Amount
    if (endSettingType === 0) {
      const number = parseInt(
        await term.waitForUserInput("What is the amount to stop the mint?", {
          validator: (input) => {
            if (!PgValidator.isInt(input)) return false;
            if (parseInt(input) > configData.number!) {
              throw new Error(
                "Your end settings amount cannot be more than the number of items in your candy machine."
              );
            }
          },
        })
      );

      configData.endSettings = {
        endSettingType: EndSettingType.Amount,
        number,
      };
    }
    // Date
    else {
      const date = await term.waitForUserInput(
        [
          "What is the date to stop the mint?",
          "Many common formats are supported.",
          "If unsure, try YYYY-MM-DD HH:MM:SS [+/-]UTC-OFFSET.",
          "For example 2022-05-02 18:00:00 +0000 for May 2, 2022 18:00:00 UTC.",
        ].join(" "),
        {
          // TODO: Validation
        }
      );

      // Convert to ISO 8601 for consistency, before storing in config
      const formattedDate = toDateTime(date);
      configData.endSettings = {
        endSettingType: EndSettingType.Date,
        date: formattedDate,
      };
    }
  } else {
    configData.endSettings = null;
  }

  // Hidden Settings
  if (choices.includes(4)) {
    const name = await term.waitForUserInput(
      "What is the prefix name for your hidden settings mints? The mint index will be appended at the end of the name.",
      {
        validator: (input) => {
          if (input.length > 25) {
            throw new Error(
              "Your hidden settings name probably cannot be longer than 25 characters."
            );
          }
        },
      }
    );

    const uri = await term.waitForUserInput(
      "What is URI to be used for each mint?",
      {
        validator: (input) => {
          if (input.length > 200) {
            throw new Error("The URI cannot be longer than 200 characters.");
          }

          // This throws an error if url is invalid
          new URL(input);
        },
      }
    );

    configData.hiddenSettings = { name, uri, hash: [] };
  } else {
    configData.hiddenSettings = null;
  }

  // Freeze Settings
  if (choices.includes(5)) {
    const days = await term.waitForUserInput(
      "How many days do you want to freeze the treasury funds and minted NFTs for? (max: 31)",
      {
        default: MAX_FREEZE_DAYS.toString(),
        validator: (input) => {
          if (!PgValidator.isInt(input)) {
            throw new Error(`Couldn't parse input of '${input}' to a number.`);
          }
          if (parseInt(input) > MAX_FREEZE_DAYS) {
            throw new Error(
              `Freeze time cannot be greater than ${MAX_FREEZE_DAYS} days.`
            );
          }
        },
      }
    );

    // Convert to seconds for storing in config and to match candy machine value
    configData.freezeTime = parseInt(days) * 86400;
  } else {
    configData.freezeTime = null;
  }

  // Upload method
  const uploadMethod = await term.waitForUserInput(
    "What upload method do you want to use?",
    {
      multiChoice: {
        items: [
          "Bundlr", // 0
          "AWS", // 1
          "NFT Storage", // 2
          "SHDW", // 3
        ],
        chooseOne: true,
      },
      default: "0",
    }
  );

  switch (uploadMethod) {
    // Bundlr
    case 0: {
      // This is the default, do nothing.
      break;
    }

    // AWS
    case 1: {
      const bucket = await term.waitForUserInput(
        "What is the AWS S3 bucket name?"
      );
      const profile = await term.waitForUserInput(
        "What is the AWS profile name?",
        { default: "default" }
      );
      const directory = await term.waitForUserInput(
        "What is the directory to upload to? Leave blank to store files at the bucket root dir.",
        { default: "" }
      );

      configData.awsConfig = { bucket, profile, directory };
      break;
    }

    // NFT Storage
    case 2: {
      configData.nftStorageAuthToken = await term.waitForUserInput(
        "What is the NFT Storage authentication token?"
      );
      break;
    }

    // SHDW
    case 3: {
      configData.shdwStorageAccount = await term.waitForUserInput(
        "What is the SHDW storage address?",
        { validator: PgValidator.isPubkey }
      );
    }
  }

  // Save the file
  PgTerminal.logWasm(`\n[2/2] ${Emoji.PAPER} Saving config file\n`);

  const explorer = await PgExplorer.get();
  const configPath = PgExplorer.joinPaths([
    explorer.currentWorkspacePath,
    PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH,
  ]);

  let saveFile = true;
  if (await explorer.exists(configPath)) {
    saveFile =
      (await term.waitForUserInput(
        [
          `The file "${PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH}" already exists.`,
          "Do you want to overwrite it with the new config or log the new config to the console?",
        ].join(" "),
        {
          default: "0",
          multiChoice: {
            items: ["Overwrite the file", "Log to console"],
            chooseOne: true,
          },
        }
      )) === 0;
  }

  if (saveFile) {
    PgTerminal.logWasm(
      `Saving config to file: "${PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH}"\n`
    );
    await explorer.newItem(configPath, JSON.stringify(configData, null, 2), {
      override: true,
    });
    PgTerminal.logWasm(
      `${PgTerminal.secondary("Successfully generated the config file.")} ${
        Emoji.CONFETTI
      }`
    );
  } else {
    PgTerminal.logWasm("Logging config to console:\n");
    PgTerminal.logWasm(configData);
  }
};
