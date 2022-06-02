import { ChangeEvent, useMemo } from "react";
import { useAtom } from "jotai";
import { Commitment } from "@solana/web3.js";

import Select from "../../../../Select";
import { COMMITMENT_LEVELS } from "../../../../../constants";
import { connAtom } from "../../../../../state";
import { PgConnection } from "../../../../../utils/pg";

const CommitmentSetting = () => {
  const [conn, setConn] = useAtom(connAtom);

  const changeCommitment = (e: ChangeEvent<HTMLSelectElement>) => {
    const newCommitment = e.target.value as Commitment;
    setConn((c) => ({ ...c, commitment: newCommitment }));
    PgConnection.update({ commitment: newCommitment });
  };

  const cluster = useMemo(() => {
    return COMMITMENT_LEVELS.filter((c) => c === conn.commitment)[0];
  }, [conn.commitment]);

  return (
    <Select value={cluster} onChange={changeCommitment}>
      {COMMITMENT_LEVELS.map((c, i) => (
        <option key={i}>{c}</option>
      ))}
    </Select>
  );
};

export default CommitmentSetting;
