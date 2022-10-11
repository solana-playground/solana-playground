import { ConfigData, ToPrimitive } from "../../types";
import { Emoji } from "../../../../../../constants";
import { PgTerminal } from "../../../../terminal";
import { PgValidator } from "../../../../validator";
import { PgExplorer } from "../../../../explorer";
import { PgCommon } from "../../../../common";
import { MAX_NAME_LENGTH, MAX_URI_LENGTH } from "../../constants";

export const processCreateConfig = async () => {
  const term = await PgTerminal.get();

  term.println(`[1/2] ${Emoji.CANDY} Sugar interactive config maker`);
  term.println(
    "\nCheck out our Candy Machine config docs to learn about the options:"
  );
  term.println(
    `  -> ${PgTerminal.underline(
      "https://docs.metaplex.com/tools/sugar/configuration"
    )}\n`
  );

  const configData: Partial<ToPrimitive<ConfigData>> = {};

  // Size
  configData.size = parseInt(
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

  // Royalties(seller fee basis points)
  configData.royalties = parseInt(
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
    const address = await term.waitForUserInput(
      `Enter creator wallet address #${i + 1}`,
      {
        validator: PgValidator.isPubkey,
      }
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
    "Which extra features do you want to use? Leave empty for no extra features.",
    {
      allowEmpty: true,
      choice: {
        items: [
          "Hidden Settings", // 0
        ],
        allowMultiple: true,
      },
    }
  );

  // Hidden Settings
  if (choices.includes(0)) {
    const name = await term.waitForUserInput(
      "What is the prefix name for your hidden settings mints? The mint index will be appended at the end of the name.",
      {
        validator: (input) => {
          if (input.length > MAX_NAME_LENGTH - 7) {
            throw new Error(
              `Your hidden settings name probably cannot be longer than ${
                MAX_NAME_LENGTH - 7
              } characters.`
            );
          }
        },
      }
    );

    const uri = await term.waitForUserInput(
      "What is URI to be used for each mint?",
      {
        validator: (input) => {
          if (input.length > MAX_URI_LENGTH) {
            throw new Error(
              `The URI cannot be longer than ${MAX_URI_LENGTH} characters.`
            );
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

  // Upload method
  configData.uploadConfig = {
    method: await term.waitForUserInput(
      "What upload method do you want to use?",
      {
        choice: {
          items: [
            "Bundlr", // 0
            "AWS", // 1
            "NFT Storage", // 2
            "SHDW", // 3
            "Pinata", // 4
          ],
        },
        default: "0",
      }
    ),
    awsConfig: null,
    nftStorageAuthToken: null,
    pinataConfig: null,
    shdwStorageAccount: null,
  };

  switch (configData.uploadConfig.method) {
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
        { allowEmpty: true }
      );
      const domain = await term.waitForUserInput(
        "Do you have a custom domain? Leave blank to use AWS default domain.",
        { allowEmpty: true }
      );

      configData.uploadConfig.awsConfig = {
        bucket,
        profile,
        directory,
        domain: domain ? domain : null,
      };
      break;
    }

    // NFT Storage
    case 2: {
      configData.uploadConfig.nftStorageAuthToken = await term.waitForUserInput(
        "What is the NFT Storage authentication token?"
      );
      break;
    }

    // SHDW
    case 3: {
      configData.uploadConfig.shdwStorageAccount = await term.waitForUserInput(
        "What is the SHDW storage address?",
        { validator: PgValidator.isPubkey }
      );
      break;
    }

    // Pinata
    case 4: {
      const jwt = await term.waitForUserInput(
        "What is your Pinata JWT authentication?"
      );

      const apiGateway = await term.waitForUserInput(
        "What is the Pinata API gateway for upload?",
        { default: "https://api.pinata.cloud" }
      );

      const contentGateway = await term.waitForUserInput(
        "What is the Pinata gateway for content retrieval?",
        { default: "https://gateway.pinata.cloud" }
      );

      const parallelLimit = parseInt(
        await term.waitForUserInput(
          "How many concurrent uploads are allowed?",
          { validator: PgValidator.isInt }
        )
      );

      configData.uploadConfig.pinataConfig = {
        jwt,
        apiGateway,
        contentGateway,
        parallelLimit,
      };
    }
  }

  // Is mutable
  configData.isMutable = await term.waitForUserInput(
    "Do you want your NFTs to remain mutable? We HIGHLY recommend you choose yes.",
    { confirm: true }
  );

  // Save the file
  term.println(`\n[2/2] ${Emoji.PAPER} Saving config file\n`);

  const explorer = await PgExplorer.get();

  let saveFile = true;
  if (await explorer.exists(PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH)) {
    saveFile =
      (await term.waitForUserInput(
        [
          `The file "${PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH}" already exists.`,
          "Do you want to overwrite it with the new config or log the new config to the console?",
        ].join(" "),
        {
          default: "0",
          choice: {
            items: ["Overwrite the file", "Log to console"],
          },
        }
      )) === 0;
  }

  const prettyConfigData = PgCommon.prettyJSON(configData);

  if (saveFile) {
    term.println(
      `Saving config to file: "${PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH}"\n`
    );
    await explorer.newItem(
      PgExplorer.PATHS.CANDY_MACHINE_CONFIG_FILEPATH,
      prettyConfigData,
      {
        override: true,
      }
    );
    term.println(
      `${PgTerminal.secondary("Successfully generated the config file.")} ${
        Emoji.CONFETTI
      }`
    );
  } else {
    term.println("Logging config to console:\n");
    term.println(prettyConfigData);
  }
};
