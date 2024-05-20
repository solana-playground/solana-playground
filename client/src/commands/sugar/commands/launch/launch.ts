import { processCreateConfig } from "../create-config";
import { processDeploy } from "../deploy";
import { processUpload } from "../upload";
import { processValidate } from "../validate";
import { processVerify } from "../verify";
import { loadConfigData } from "../../utils";
import { Emoji } from "../../../../constants";
import { PgTerminal } from "../../../../utils/pg";

export const processLaunch = async (
  rpcUrl: string | undefined,
  strict: boolean,
  skipCollectionPrompt: boolean
) => {
  const term = await PgTerminal.get();

  term.println(`Starting Sugar launch... ${Emoji.LAUNCH}`);

  // Config
  try {
    await loadConfigData();
  } catch {
    term.println("");

    if (
      await term.waitForUserInput(
        "Could not load config file. Would you like to create a new config file?",
        { confirm: true, default: "yes" }
      )
    ) {
      term.println(`\n${PgTerminal.secondary(">>>")} sugar create-config\n`);
      await processCreateConfig();
    } else {
      throw new Error("Can't continue without creating a config file.");
    }
  }

  // Validate
  term.println(`\n${PgTerminal.secondary(">>>")} sugar validate\n`);
  await processValidate(strict, skipCollectionPrompt);

  // Upload
  term.println(`\n${PgTerminal.secondary(">>>")} sugar upload\n`);
  await processUpload(rpcUrl);

  // Deploy
  term.println(`\n${PgTerminal.secondary(">>>")} sugar deploy\n`);
  await processDeploy(rpcUrl);

  // Verify
  term.println(`\n${PgTerminal.secondary(">>>")} sugar verify\n`);
  await processVerify(rpcUrl);
};
