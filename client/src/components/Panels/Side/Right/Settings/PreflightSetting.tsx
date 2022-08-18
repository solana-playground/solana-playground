import { ChangeEvent } from "react";
import { useAtom } from "jotai";

import Select from "../../../../Select";
import { connAtom } from "../../../../../state";
import { PgConnection } from "../../../../../utils/pg";

enum PreflightChecksOption {
  ENABLED = "enabled",
  DISABLED = "disabled",
}

const PreflightSetting = () => {
  const [conn, setConn] = useAtom(connAtom);

  const changePreflight = (e: ChangeEvent<HTMLSelectElement>) => {
    const isPreflightEnabled =
      e.target.value === PreflightChecksOption.ENABLED ? true : false;
    setConn((c) => ({ ...c, preflightChecks: isPreflightEnabled }));
    PgConnection.update({ preflightChecks: isPreflightEnabled });
  };

  return (
    <Select
      value={
        conn.preflightChecks === true
          ? PreflightChecksOption.ENABLED
          : PreflightChecksOption.DISABLED
      }
      onChange={changePreflight}
    >
      <option>{PreflightChecksOption.ENABLED}</option>
      <option>{PreflightChecksOption.DISABLED}</option>
    </Select>
  );
};

export default PreflightSetting;
