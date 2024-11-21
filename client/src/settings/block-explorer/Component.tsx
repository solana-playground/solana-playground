import { useEffect, useMemo, useState } from "react";

import Select from "../../components/Select";
import { PgBlockExplorer, PgSettings } from "../../utils/pg";

const BlockExplorer = () => {
  const options = useMemo(
    () =>
      PgBlockExplorer.blockExplorers.map((be) => ({
        value: be.name,
        label: be.name,
      })),
    []
  );
  const [value, setValue] = useState<typeof options[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeOtherBlockExplorer((be) =>
      setValue(options.find((o) => o.value === be))
    );
    return dispose;
  }, [options]);

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        PgSettings.other.blockExplorer = newValue!.value;
      }}
    />
  );
};

export default BlockExplorer;
