import { useMemo } from "react";
import { useAtom } from "jotai";

import { Endpoint } from "../../../constants";
import { connAtom } from "../../../state";

export const useAirdropAmount = () => {
  const [conn] = useAtom(connAtom);

  const amount = useMemo(() => {
    const endpoint = conn.endpoint;
    if (endpoint === Endpoint.LOCALHOST) return 100;
    if (endpoint === Endpoint.DEVNET) return 2;
    if (endpoint === Endpoint.TESTNET) return 1;

    return null;
  }, [conn.endpoint]);

  return amount;
};
