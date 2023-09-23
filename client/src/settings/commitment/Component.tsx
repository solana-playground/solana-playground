import { useEffect, useMemo, useState } from "react";

import Select from "../../components/Select";
import { COMMITMENT_LEVELS } from "../../constants";
import { PgSettings } from "../../utils/pg";

const CommitmentSetting = () => {
  const options = useMemo(
    () => COMMITMENT_LEVELS.map((c) => ({ value: c, label: c })),
    []
  );

  const [value, setValue] = useState<typeof options[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionCommitment(
      (commitment) => setValue(options.find((o) => o.value === commitment))
    );
    return () => dispose();
  }, [options]);

  return (
    <Select
      options={options}
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
