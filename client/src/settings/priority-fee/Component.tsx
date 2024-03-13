import { useEffect, useMemo, useState } from "react";

import Select from "../../components/Select";
import { PgSettings } from "../../utils/pg";

const PriorityFee = () => {
  const options = useMemo(
    () => (["avg", "min", "max"] as const).map((c) => ({ value: c, label: c })),
    []
  );

  const [value, setValue] = useState<typeof options[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionPriorityFee((fee) =>
      setValue(options.find((o) => o.value === fee))
    );
    return () => dispose();
  }, [options]);

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        const newPriorityFee = newValue?.value;
        if (newPriorityFee) {
          PgSettings.connection.priorityFee = newPriorityFee;
        }
      }}
    />
  );
};

export default PriorityFee;
