import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import Select from "../../../../Select";
import { NETWORKS } from "../../../../../constants";
import { connAtom } from "../../../../../state";
import { PgConnection, PgModal, PgTerminal } from "../../../../../utils/pg";
import useModal from "../../../../Modal/useModal";
import ModalInside from "../../../../Modal/ModalInside";
import Button from "../../../../Button";
import Input from "../../../../Input";
import styled from "styled-components";

const CustomEndpoint = () => {
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const { close } = useModal();
  return (
    <>
      <ModalInside>
        <ModalCard>
          <CloseButton>
            <Button
              kind="no-border"
              onClick={() => {
                close();
              }}
            >
              X
            </Button>
          </CloseButton>
          <Input
            style={{ width: "100%", height: "3rem" }}
            placeholder="Custom Endpoint"
            onChange={(e) => {
              setCustomEndpoint(e.target.value);
            }}
          />
          <Button
            onClick={() => {
              PgTerminal.runCmdFromStr(
                `solana config set -u ${customEndpoint}`
              );
              close();
            }}
            fullWidth
            kind="primary-transparent"
            style={{ height: "3rem" }}
          >
            Add
          </Button>
        </ModalCard>
      </ModalInside>
    </>
  );
};

const EndpointSetting = () => {
  const [conn, setConn] = useAtom(connAtom);

  const options = useMemo(() => {
    const options = NETWORKS.map((n) => ({ value: n.endpoint, label: n.name }));
    return options;
  }, []);
  const value = useMemo(
    () => options.find((o) => o.value === conn.endpoint),
    [options, conn.endpoint]
  );

  return (
    <>
      <Select
        options={options}
        value={value}
        onChange={(newValue) => {
          if (newValue?.value === "CUSTOM") {
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
    </>
  );
};

const ModalCard = styled.div`
  width: 25rem;
  height: max-content;
  border-radius: 0.4rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: start;
  gap: 1rem;
`;
const CloseButton = styled.div`
  width: 100%;
  display: flex;
  justify-content: end;
`;
export default EndpointSetting;
