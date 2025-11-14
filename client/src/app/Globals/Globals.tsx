import { GLOBALS } from "../../globals";
import { initAll } from "../../utils/pg";
import { useDisposable } from "../../hooks";

const getInitables = () => initAll(GLOBALS);

const Globals = () => {
  useDisposable(getInitables);
  return null;
};

export default Globals;
