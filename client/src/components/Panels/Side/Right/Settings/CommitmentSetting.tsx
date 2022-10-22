import { useMemo } from "react";
import { useAtom } from "jotai";
import { Commitment } from "@solana/web3.js";

import Select from "../../../../Select";
import { COMMITMENT_LEVELS } from "../../../../../constants";
import { connAtom } from "../../../../../state";
import { PgConnection } from "../../../../../utils/pg";

const CommitmentSetting = () => {
  const [conn, setConn] = useAtom(connAtom);

  const options = useMemo(
    () => COMMITMENT_LEVELS.map((c) => ({ value: c, label: c })),
    []
  );
  const value = useMemo(
    () => options.find((o) => o.value === conn.commitment),
    [conn.commitment, options]
  );

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        const newCommitment = newValue?.value as Commitment;
        setConn((c) => ({ ...c, commitment: newCommitment }));
        PgConnection.update({ commitment: newCommitment });
      }}
    />
  );
};

export default CommitmentSetting;
