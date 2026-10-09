import { PgCommon, PgJsPackage, PgTerminal } from "../../utils";

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
