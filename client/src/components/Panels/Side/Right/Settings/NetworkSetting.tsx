import { useAtom } from "jotai";
import { ChangeEvent, useCallback, useMemo } from "react";

import { NETWORKS } from "../../../../../constants";
import { endpointAtom } from "../../../../../state/solana";
import { PgEndpoint } from "../../../../../utils/pg/endpoint";
import Select from "../../../../Select";

const NetworkSetting = () => {
  const [endpoint, setEndpoint] = useAtom(endpointAtom);

  const changeEndpoint = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newEndpoint = NETWORKS.filter((n) => n.name === e.target.value)[0]
        .endpoint;
      setEndpoint(newEndpoint);
      PgEndpoint.setLsEndpoint(newEndpoint);
    },
    [setEndpoint]
  );

  const cluster = useMemo(() => {
    return NETWORKS.filter((n) => n.endpoint === endpoint)[0].name;
  }, [endpoint]);

  return (
    <Select value={cluster} onChange={changeEndpoint}>
      {NETWORKS.map((n, i) => (
        <option key={i}>{n.name}</option>
      ))}
    </Select>
  );
};

export default NetworkSetting;
