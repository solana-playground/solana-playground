import { useEffect, useState } from "react";

import Select from "../../components/Select";
import { PgBlockExplorer, PgSettings } from "../../utils/pg";

const OPTIONS = PgBlockExplorer.ALL.map((be) => ({
  value: be.name,
  label: be.name,
}));

const BlockExplorer = () => {
  const [value, setValue] = useState<typeof OPTIONS[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeOtherBlockExplorer((be) =>
      setValue(OPTIONS.find((o) => o.value === be))
    );
    return () => dispose();
  }, []);

  return (
    <Select
      options={OPTIONS}
      value={value}
      onChange={(newValue) => {
        PgSettings.other.blockExplorer = newValue!.value;
      }}
    />
  );
};

export default BlockExplorer;
