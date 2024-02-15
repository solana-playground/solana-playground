import { ChangeEvent, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import Input from "../../components/Input";
import Link from "../../components/Link";
import Modal from "../../components/Modal";
import Select from "../../components/Select";
import Text from "../../components/Text";
import { Info } from "../../components/Icons";
import { Endpoint, NetworkName, NETWORKS } from "../../constants";
import { PgCommand, PgCommon, PgSettings, PgView } from "../../utils/pg";

const EndpointSetting = () => {
  const options = useMemo(
    () =>
      NETWORKS.map((n) => ({ value: n.endpoint, label: n.name })).filter((n) =>
        process.env.NODE_ENV === "production"
          ? n.label !== NetworkName.PLAYNET
          : true
      ),
    []
  );

  const [value, setValue] = useState<typeof options[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionEndpoint((endpoint) => {
      setValue(
        options.find((o) => o.value === endpoint) ??
          options.find((o) => o.label === NetworkName.CUSTOM)
      );
    });
    return () => dispose();
  }, [options]);

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        if (newValue?.value === Endpoint.CUSTOM) {
          PgView.setModal(CustomEndpoint);
        } else {
          const newEndpoint = NETWORKS.find(
            (n) => n.name === newValue?.label
          )!.endpoint;
          PgSettings.connection.endpoint = newEndpoint;
        }
      }}
    />
  );
};

const CustomEndpoint = () => {
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setCustomEndpoint(ev.target.value);
    setError("");
  };

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Add",
        onSubmit: () => PgCommand.solana.run(`config set -u ${customEndpoint}`),
        disabled: error === "",
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
          value={customEndpoint}
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
