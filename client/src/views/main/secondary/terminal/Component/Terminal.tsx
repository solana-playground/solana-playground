import TerminalComponent from "../../../../../components/Terminal";
import { PgCommandManager } from "../../../../../utils/pg";

const Terminal = () => <TerminalComponent cmdManager={PgCommandManager} />;

export default Terminal;
