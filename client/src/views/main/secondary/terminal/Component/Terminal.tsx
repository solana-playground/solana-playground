import TerminalComponent from "../../../../../components/Terminal";
import { PgCommandManager } from "../../../../../utils";

const Terminal = () => <TerminalComponent cmdManager={PgCommandManager} />;

export default Terminal;
