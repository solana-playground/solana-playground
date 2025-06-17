import { useMemo, useState } from "react";
import styled from "styled-components";

import Input from "../../components/Input";
import Link from "../../components/Link";
import Modal from "../../components/Modal";
import Text from "../../components/Text";
import { Info } from "../../components/Icons";
import { PgSettings } from "../../utils/pg";

const CustomPriorityFee = () => {
  const [value, setValue] = useState(
    typeof PgSettings.connection.priorityFee === "number"
      ? PgSettings.connection.priorityFee.toString()
      : ""
  );
  const [error, setError] = useState("");

  const { parseCustomValue } = useMemo(
    () => PgSettings.all.find((s) => s.id === "connection.priorityFee")!,
    []
  );

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Set",
        onSubmit: () => {
          PgSettings.connection.priorityFee = parseCustomValue!(value);
        },
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
          validator={parseCustomValue}
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

export default CustomPriorityFee;
