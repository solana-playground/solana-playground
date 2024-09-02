import { useEffect, useState } from "react";

import Select from "../../components/Select";
import { PgSettings, UnionToTuple } from "../../utils/pg";

type Option = UnionToTuple<typeof PgSettings["connection"]["commitment"]>;
const OPTIONS = (["processed", "confirmed", "finalized"] as Option).map(
  (o) => ({
    value: o,
    label: o,
  })
);

const CommitmentSetting = () => {
  const [value, setValue] = useState<typeof OPTIONS[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionCommitment(
      (commitment) => setValue(OPTIONS.find((o) => o.value === commitment))
    );
    return () => dispose();
  }, []);

  return (
    <Select
      options={OPTIONS}
      value={value}
      onChange={(newValue) => {
        const newCommitment = newValue?.value;
        if (newCommitment) {
          PgSettings.connection.commitment = newCommitment;
        }
      }}
    />
  );
};

export default CommitmentSetting;
