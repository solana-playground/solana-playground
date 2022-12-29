import { useEffect, useState } from "react";
import { useAtom } from "jotai";

import { connAtom } from "../../state";
import { EventName } from "../../constants";
import { PgPlaynet } from "../../utils/pg";
import { useSetStatic } from "../../hooks";

/**
 * Handle Playnet state
 *
 * @returns customFetch
 */
export const usePlaynet = () => {
  const [conn] = useAtom(connAtom);

  const [customFetch, setCustomFetch] = useState({ fetch });
  useSetStatic(setCustomFetch, EventName.PLAYNET_FETCH_SET);

  useEffect(() => {
    if (PgPlaynet.isUrlPlaynet(conn.endpoint)) {
      PgPlaynet.init();
    } else {
      PgPlaynet.destroy();
    }
  }, [conn.endpoint]);

  return { customFetch };
};
