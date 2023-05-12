import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";

import Input from "../../../../../../components/Input";
import Select from "../../../../../../components/Select";
import Modal from "../../../../../../components/Modal";
import useModal from "../../../../../../components/Modal/useModal";
import { Endpoint, NetworkName, NETWORKS } from "../../../../../../constants";
import { connectionConfigAtom } from "../../../../../../state";
import {
  PgConnection,
  PgTerminal,
  PgValidator,
  PgView,
} from "../../../../../../utils/pg";
import { useOnKey } from "../../../../../../hooks";

const EndpointSetting = () => {
  const [conn, setConn] = useAtom(connectionConfigAtom);

  const options = useMemo(
    () =>
      NETWORKS.map((n) => ({ value: n.endpoint, label: n.name })).filter((n) =>
        process.env.NODE_ENV === "production"
          ? n.label !== NetworkName.PLAYNET
          : true
      ),
    []
  );
  const value = useMemo(
    () =>
      options.find((o) => o.value === conn.endpoint) ??
      options.find((o) => o.label === NetworkName.CUSTOM),
    [options, conn.endpoint]
  );

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
          setConn((c) => ({ ...c, endpoint: newEndpoint }));
          PgConnection.update({ endpoint: newEndpoint });
        }
      }}
    />
  );
};

const CustomEndpoint = () => {
  const [customEndpoint, setCustomEndpoint] = useState("");

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = () => {
    PgTerminal.COMMANDS.solana(`config set -u ${customEndpoint}`);
    close();
  };

  // Submit on enter
  useOnKey("Enter", onSubmit);

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Add",
        onSubmit,
        fullWidth: true,
        style: { height: "2.5rem", marginTop: "-0.25rem" },
      }}
    >
      <Input
        ref={inputRef}
        placeholder="Custom endpoint"
        onChange={(e) => setCustomEndpoint(e.target.value)}
        validator={PgValidator.isUrl}
      />
    </Modal>
  );
};

export default EndpointSetting;
