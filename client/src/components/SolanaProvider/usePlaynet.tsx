import { useEffect, useState } from "react";

import { EventName } from "../../constants";
import { PgPlaynet, PgSettings } from "../../utils/pg";
import { useSetStatic } from "../../hooks";

/**
 * Handle Playnet state.
 *
 * @returns an overridden fetch function
 */
export const usePlaynet = () => {
  const [customFetch, setCustomFetch] = useState({ fetch });
  useSetStatic(setCustomFetch, EventName.PLAYNET_FETCH_SET);

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionEndpoint((endpoint) => {
      if (PgPlaynet.isUrlPlaynet(endpoint)) {
        PgPlaynet.init();
      } else {
        PgPlaynet.destroy();
      }
    });

    return () => dispose();
  }, []);

  return { customFetch };
};
