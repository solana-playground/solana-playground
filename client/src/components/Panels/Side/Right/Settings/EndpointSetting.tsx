import { ChangeEvent, useMemo } from "react";
import { useAtom } from "jotai";

import Select from "../../../../Select";
import { NETWORKS } from "../../../../../constants";
import { connAtom } from "../../../../../state";
import { PgConnection } from "../../../../../utils/pg";

const EndpointSetting = () => {
  const [conn, setConn] = useAtom(connAtom);

  const changeEndpoint = (e: ChangeEvent<HTMLSelectElement>) => {
    const newEndpoint = NETWORKS.filter((n) => n.name === e.target.value)[0]
      .endpoint;
    setConn((c) => ({ ...c, endpoint: newEndpoint }));
    PgConnection.update({ endpoint: newEndpoint });
  };

  const cluster = useMemo(() => {
    return NETWORKS.filter((n) => n.endpoint === conn.endpoint)[0].name;
  }, [conn.endpoint]);

  return (
    <Select value={cluster} onChange={changeEndpoint}>
      {NETWORKS.map((n, i) => (
        <option key={i}>{n.name}</option>
      ))}
    </Select>
  );
};

export default EndpointSetting;
