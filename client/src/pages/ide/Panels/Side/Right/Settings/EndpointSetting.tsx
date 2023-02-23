import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../../../components/Button";
import Input from "../../../../../../components/Input";
import Select from "../../../../../../components/Select";
import Modal from "../../../../../../components/Modal/Modal";
import useModal from "../../../../../../components/Modal/useModal";
import { Endpoint, NetworkName, NETWORKS } from "../../../../../../constants";
import { connAtom } from "../../../../../../state";
import { PgConnection, PgModal, PgTerminal } from "../../../../../../utils/pg";
import { useOnKey } from "../../../../../../hooks";

const EndpointSetting = () => {
  const [conn, setConn] = useAtom(connAtom);

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
          PgModal.set(CustomEndpoint);
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
    PgTerminal.execute({ solana: `config set -u ${customEndpoint}` });
    close();
  };

  // Submit on enter
  useOnKey("Enter", onSubmit);

  return (
    <Modal closeButton>
      <ModalCard>
        <Input
          ref={inputRef}
          style={{ width: "100%", height: "3rem" }}
          placeholder="Custom endpoint"
          onChange={(e) => setCustomEndpoint(e.target.value)}
        />
        <Button
          onClick={onSubmit}
          fullWidth
          kind="primary-transparent"
          style={{ height: "3rem" }}
        >
          Add
        </Button>
      </ModalCard>
    </Modal>
  );
};

const ModalCard = styled.div`
  width: 25rem;
  padding: 1rem 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

export default EndpointSetting;
