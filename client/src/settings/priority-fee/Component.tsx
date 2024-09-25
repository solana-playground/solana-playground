import { useEffect, useState } from "react";
import styled from "styled-components";

import Input from "../../components/Input";
import Link from "../../components/Link";
import Modal from "../../components/Modal";
import Select from "../../components/Select";
import Text from "../../components/Text";
import { Info } from "../../components/Icons";
import { PgCommon, PgSettings, PgView, UnionToTuple } from "../../utils/pg";

type Option = UnionToTuple<
  Exclude<typeof PgSettings["connection"]["priorityFee"], number> | "custom"
>[number][];
const OPTIONS = (["average", "median", "min", "max", "custom"] as Option).map(
  (o) => ({
    value: o,
    label: o,
  })
);

const PriorityFee = () => {
  const [value, setValue] = useState<typeof OPTIONS[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionPriorityFee((fee) =>
      setValue(
        typeof fee === "number"
          ? { label: `custom (${fee})` as "custom", value: "custom" }
          : OPTIONS.find((o) => o.value === fee)
      )
    );
    return () => dispose();
  }, []);

  return (
    <Select
      options={OPTIONS}
      value={value}
      onChange={(newValue) => {
        const newPriorityFee = newValue?.value;
        if (newPriorityFee === "custom") {
          PgView.setModal(CustomPriorityFee);
        } else {
          PgSettings.connection.priorityFee = newPriorityFee!;
        }
      }}
    />
  );
};

const CustomPriorityFee = () => {
  const [value, setValue] = useState(
    typeof PgSettings.connection.priorityFee === "number"
      ? PgSettings.connection.priorityFee.toString()
      : ""
  );
  const [error, setError] = useState("");

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Set",
        onSubmit: () => (PgSettings.connection.priorityFee = parseInt(value)),
        disabled: !value,
        fullWidth: true,
        style: { height: "2.5rem", marginTop: "-0.25rem" },
      }}
      error={error}
      setError={setError}
    >
      <Content>
        <InputLabel>Priority fee (in micro lamports)</InputLabel>
        <Input
          autoFocus
          placeholder="9000"
          value={value}
          onChange={(ev) => {
            setValue(ev.target.value);
            setError("");
          }}
          error={error}
          setError={setError}
          validator={PgCommon.isInt}
        />

        <InfoText icon={<Info color="info" />}>
          Check out the priority fees{" "}
          <Link href="https://solana.com/developers/guides/advanced/how-to-use-priority-fees">
            guide
          </Link>{" "}
          for more information.
        </InfoText>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  max-width: 25rem;
`;

const InputLabel = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const InfoText = styled(Text)`
  margin-top: 1rem;
`;

export default PriorityFee;
