import { useEffect, useMemo, useState } from "react";

import Select from "../../components/Select";
import { PgSettings } from "../../utils/pg";

const BlockExplorer = () => {
  const options = useMemo(
    () =>
      (["Solana Explorer", "Solscan"] as const).map((v) => ({
        value: v,
        label: v,
      })),
    []
  );

  const [value, setValue] = useState<typeof options[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeOtherBlockExplorer((be) =>
      setValue(options.find((o) => o.value === be))
    );
    return () => dispose();
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
