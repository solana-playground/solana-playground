import {
  PgCommand,
  PgCommon,
  PgJsPackage,
  PgSettings,
  PgTerminal,
} from "../../utils";

/** Require the unstable experimental features setting to be enabled. */
export const checkExperimentalUnstable = () => {
  if (PgSettings.experimental.unstable) return;

  throw new Error(
    `This command requires the experimental features setting to be enabled. \
You can enable them by running \
\`${PgCommand.setting.name} set experimental.unstable true\`.`
  );
};

/**
 * Create a common package manager command handler.
 *
 * @param names names to print
 */
export const createHandler = (names: { loading: string; success: string }) => {
  return async (input: { tokens: string[] }) => {
    PgTerminal.println(PgTerminal.info(`${names.loading}...`));
    const startTime = performance.now();
    await PgJsPackage.update(input.tokens);
    const timePassed = (performance.now() - startTime) / 1000;
    PgTerminal.println(
      `${PgTerminal.success(
        `${names.success} successful.`
      )} Completed in ${PgCommon.formatSeconds(timePassed)}.`
    );
  };
};
