import { useMemo } from "react";
import { useAtom } from "jotai";

import { Endpoint } from "../../../../../constants";
import { endpointAtom } from "../../../../../state";

const useAirdropAmount = () => {
  const [endpoint] = useAtom(endpointAtom);

  const amount = useMemo(() => {
    if (endpoint === Endpoint.LOCALHOST) return 100;
    else if (endpoint === Endpoint.DEVNET) return 2;
    else if (endpoint === Endpoint.TESTNET) return 1;

    return null;
  }, [endpoint]);

  return amount;
};

export default useAirdropAmount;
