import { ChangeEvent, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import Input from "../../components/Input";
import Link from "../../components/Link";
import Modal from "../../components/Modal";
import Select from "../../components/Select";
import Text from "../../components/Text";
import { Info } from "../../components/Icons";
import { NETWORKS } from "../../constants";
import { PgCommand, PgCommon, PgSettings, PgView } from "../../utils/pg";

const EndpointSetting = () => {
  const options = useMemo(
    () => [
      ...NETWORKS.map((n) => ({ label: n.name, value: n.endpoint })),
      { label: "Custom", value: "" },
    ],
    []
  );

  const [value, setValue] = useState<typeof options[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionEndpoint((endpoint) => {
      setValue(options.find((o) => o.value === endpoint) ?? options.at(-1));
    });
    return dispose;
  }, [options]);

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        if (newValue?.value) PgSettings.connection.endpoint = newValue.value;
        else PgView.setModal(CustomEndpoint);
      }}
    />
  );
};

const CustomEndpoint = () => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setValue(ev.target.value);
    setError("");
  };

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Add",
        onSubmit: () => PgCommand.solana.execute("config", "set", "-u", value),
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
          onChange={handleChange}
          error={error}
          setError={setError}
          validator={PgCommon.isUrl}
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

export default EndpointSetting;
