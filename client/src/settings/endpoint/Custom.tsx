import { useMemo, useState } from "react";
import styled from "styled-components";

import Input from "../../components/Input";
import Link from "../../components/Link";
import Modal from "../../components/Modal";
import Text from "../../components/Text";
import { Info } from "../../components/Icons";
import { PgSettings } from "../../utils/pg";

const CustomEndpoint = () => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const { parseCustomValue } = useMemo(
    () => PgSettings.all.find((s) => s.id === "connection.endpoint")!,
    []
  );

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Add",
        onSubmit: () => {
          PgSettings.connection.endpoint = parseCustomValue!(value);
        },
        disabled: !value,
        fullWidth: true,
        style: { height: "2.5rem", marginTop: "-0.25rem" },
      }}
      error={error}
      setError={setError}
    >
      <Content>
        <InputLabel>RPC URL</InputLabel>
        <Input
          autoFocus
          placeholder="https://..."
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          error={error}
          setError={setError}
          validator={parseCustomValue}
        />

        <InfoText icon={<Info color="info" />}>
          Check out the list of{" "}
          <Link href="https://solana.com/rpc">RPC providers</Link> if you don't
          have a custom endpoint.
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

export default CustomEndpoint;
