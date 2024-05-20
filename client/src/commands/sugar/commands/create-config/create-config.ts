import {
  MAX_NAME_LENGTH,
  MAX_URI_LENGTH,
  REPLACEMENT_INDEX_INCREMENT,
} from "../../constants";
import { PgSugar } from "../../processor";
import { Emoji } from "../../../../constants";
import { PgCommon, PgExplorer, PgTerminal } from "../../../../utils/pg";
import { ConfigData, ToPrimitive, UploadMethod } from "../../types";

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
      { validator: PgCommon.isInt }
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
        if (!PgCommon.isInt(input)) {
          throw new Error(`Couldn't parse input of '${input}' to a number.`);
        }
        if (parseInt(input) > 10_000) {
          throw new Error("Seller fee basis points must be 10,000 or less.");
        }
      },
    })
  );

  // Sequential
  configData.isSequential = await term.waitForUserInput(
    "Do you want to use a sequential mint index generation? We recommend you choose no.",
    { confirm: true, default: "no" }
  );

  // Creators
  const numberOfCreators = parseInt(
    await term.waitForUserInput(
      "How many creator wallets do you have? (max limit of 4)",
      { validator: (input) => PgCommon.isInt(input) && parseInt(input) <= 4 }
    )
  );

  let totalShare = 0;
  const validateShare = (input: string, isLastCreator: boolean) => {
    if (!PgCommon.isInt(input)) {
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
        validator: PgCommon.isPk,
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
    configData.creators.push({ address, share });
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
    let name = await term.waitForUserInput(
      [
        "What is the prefix name for your hidden settings mints? The mint index will be appended at the end of the name.",
        PgTerminal.secondaryText(
          "(If you put 'My NFT', NFTs will be named 'My NFT #1' 'My NFT #2'...)"
        ),
      ].join(" "),
      {
        validator: (input) => {
          if (!input.includes(REPLACEMENT_INDEX_INCREMENT)) {
            input += ` #${REPLACEMENT_INDEX_INCREMENT}`;
          }
          const maxNameLengthWithoutFiller =
            MAX_NAME_LENGTH - (REPLACEMENT_INDEX_INCREMENT.length + 2);
          if (input.length > maxNameLengthWithoutFiller) {
            throw new Error(
              `Your hidden settings name probably cannot be longer than ${maxNameLengthWithoutFiller} characters.`
            );
          }
        },
      }
    );
    if (!name.includes(REPLACEMENT_INDEX_INCREMENT)) {
      name += ` #${REPLACEMENT_INDEX_INCREMENT}`;
    }

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
    // TODO:
    // method: await term.waitForUserInput(
    //   `"What upload method do you want to use?"`,
    //   {
    //     choice: {
    //       items: [
    //         "Bundlr", // 0
    //         "AWS", // 1
    //         "NFT Storage", // 2
    //         "SHDW", // 3
    //         "Pinata", // 4
    //       ],
    //     },
    //     default: "0",
    //   }
    // ),
    method: UploadMethod.BUNDLR,
    awsConfig: null,
    nftStorageAuthToken: null,
    pinataConfig: null,
    shdwStorageAccount: null,
  };

  switch (configData.uploadConfig.method) {
    // Bundlr
    case UploadMethod.BUNDLR: {
      // This is the default, do nothing.
      break;
    }

    // AWS
    case UploadMethod.AWS: {
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
    case UploadMethod.NFT_STORAGE: {
      configData.uploadConfig.nftStorageAuthToken = await term.waitForUserInput(
        "What is the NFT Storage authentication token?"
      );
      break;
    }

    // SHDW
    case UploadMethod.SHDW: {
      configData.uploadConfig.shdwStorageAccount = await term.waitForUserInput(
        "What is the SHDW storage address?",
        { validator: PgCommon.isPk }
      );
      break;
    }

    // Pinata
    case UploadMethod.PINATA: {
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
          { validator: PgCommon.isInt }
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

  // Mutability
  configData.isMutable = await term.waitForUserInput(
    "Do you want your NFTs to remain mutable? We HIGHLY recommend you choose yes.",
    { confirm: true, default: "yes" }
  );

  // Guards
  configData.guards = null;

  // Save the file
  term.println(`\n[2/2] ${Emoji.PAPER} Saving config file\n`);

  let saveFile = true;
  if (await PgExplorer.fs.exists(PgSugar.PATHS.CANDY_MACHINE_CONFIG_FILEPATH)) {
    saveFile =
      (await term.waitForUserInput(
        [
          `The file "${PgSugar.PATHS.CANDY_MACHINE_CONFIG_FILEPATH}" already exists.`,
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
      `Saving config to file: "${PgSugar.PATHS.CANDY_MACHINE_CONFIG_FILEPATH}"\n`
    );
    await PgExplorer.newItem(
      PgSugar.PATHS.CANDY_MACHINE_CONFIG_FILEPATH,
      prettyConfigData,
      { override: true }
    );
    term.println(
      `${PgTerminal.secondary("Successfully generated the config file.")} ${
        Emoji.CONFETTI
      }`
    );
  } else {
    term.println(PgTerminal.secondaryText("Logging config to console:\n"));
    term.println(prettyConfigData);
  }
};
