import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import Input from "../../../../../../components/Input";
import Select from "../../../../../../components/Select";
import Modal from "../../../../../../components/Modal";
import { Endpoint, NetworkName, NETWORKS } from "../../../../../../constants";
import {
  PgCommand,
  PgCommon,
  PgSettings,
  PgView,
} from "../../../../../../utils/pg";

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

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setCustomEndpoint(ev.target.value);
    setError("");
  };

  const onSubmit = async () => {
    await PgCommand.solana.run(`config set -u ${customEndpoint}`);
  };

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Add",
        onSubmit,
        disabled: !!error || error === "",
        setError,
        fullWidth: true,
        style: { height: "2.5rem", marginTop: "-0.25rem" },
      }}
    >
      <Input
        ref={inputRef}
        placeholder="Custom endpoint"
        onChange={handleChange}
        error={error}
        setError={setError}
        validator={PgCommon.isUrl}
      />
    </Modal>
  );
};

export default EndpointSetting;
