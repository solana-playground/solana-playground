import TerminalComponent from "../../../../components/Terminal";
import { COMMANDS } from "../../../../commands";
import { PgCommandManager } from "../../../../utils/pg";

// Set the available commands
PgCommandManager.commands = COMMANDS;

const Terminal = () => <TerminalComponent cmdManager={PgCommandManager} />;

export default Terminal;
