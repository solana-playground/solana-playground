import { useAtom } from "jotai";
import { useMemo } from "react";
import { Endpoints } from "../../../../../constants";
import { endpointAtom } from "../../../../../state";

const useAirdropAmount = () => {
  const [endpoint] = useAtom(endpointAtom);

  const amount = useMemo(() => {
    if (endpoint === Endpoints.LOCALHOST) return 100;
    else if (endpoint === Endpoints.DEVNET) return 2;
    else if (endpoint === Endpoints.TESTNET) return 1;

    return null;
  }, [endpoint]);

  return amount;
};

export default useAirdropAmount;
