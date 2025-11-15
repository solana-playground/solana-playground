import { GLOBALS } from "../../globals";
import { initAll } from "../../utils/pg";
import { useAsyncEffect } from "../../hooks";

const Globals = () => {
  useAsyncEffect(async () => {
    const { dispose } = await initAll(GLOBALS);
    return dispose;
  }, []);

  return null;
};

export default Globals;
