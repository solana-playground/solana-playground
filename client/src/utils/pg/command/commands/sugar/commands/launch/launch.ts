import { Emoji } from "../../../../../../../constants";
import { PgConnection } from "../../../../../connection";
import { PgTerminal } from "../../../../../terminal";
import { loadConfigData } from "../../utils";
import { processCreateConfig } from "../create-config";
import { processDeploy } from "../deploy";
import { processUpload } from "../upload";
import { processValidate } from "../validate";
import { processVerify } from "../verify";

export const processLaunch = async (
  rpcUrl: string = PgConnection.endpoint,
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
        { confirm: true }
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
