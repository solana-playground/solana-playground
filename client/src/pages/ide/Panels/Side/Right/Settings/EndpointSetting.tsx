import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../../../components/Button";
import Input from "../../../../../../components/Input";
import Select from "../../../../../../components/Select";
import Modal from "../../../../../../components/Modal/Modal";
import useModal from "../../../../../../components/Modal/useModal";
import { Endpoint, NetworkName, NETWORKS } from "../../../../../../constants";
import { connectionConfigAtom } from "../../../../../../state";
import {
  PgConnection,
  PgModal,
  PgTerminal,
  PgValidator,
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
    <Modal title closeButton>
      <ModalCard>
        <Input
          ref={inputRef}
          placeholder="Custom endpoint"
          onChange={(e) => setCustomEndpoint(e.target.value)}
          validator={PgValidator.isUrl}
        />
        <Button onClick={onSubmit} kind="primary-transparent" fullWidth>
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
  border-radius: ${({ theme }) => theme.default.borderRadius};

  & input,
  & button {
    height: 3rem;
  }
`;

export default EndpointSetting;
