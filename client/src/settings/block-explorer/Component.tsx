import { useEffect, useState } from "react";

import Select from "../../components/Select";
import { PgSettings, UnionToTuple } from "../../utils/pg";

type Option = UnionToTuple<typeof PgSettings["other"]["blockExplorer"]>;
const OPTIONS = (["Solana Explorer", "Solscan"] as Option).map((o) => ({
  value: o,
  label: o,
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
