import TerminalComponent from "../../../../../components/Terminal";
import { GITHUB_URL, PROJECT_NAME } from "../../../../../constants";
import { PgCommandManager, PgTerminal } from "../../../../../utils";

const Terminal = () => (
  <TerminalComponent
    cmdManager={PgCommandManager}
    defaultText={[
      `Welcome to ${PgTerminal.bold(PROJECT_NAME)}.`,
      `Popular crates for Solana development are available to use.`,
      `See the list of available crates and request new crates from ${PgTerminal.underline(
        GITHUB_URL
      )}`,
      `Type ${PgTerminal.bold("help")} to see all commands.\n`,
    ].join("\n\n")}
  />
);

export default Terminal;
