import React, { useState } from "react";
import styled from "styled-components";
import { PgTerminal } from "../../utils/pg";
import Button from "../Button";
import Input from "../Input";

interface Props {
  // setEnpoint: React.Dispatch<React.SetStateAction<string>>;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
}
const CustomEndpoint = ({ setModal }: Props) => {
  const [customEndpoint, setCustomEndpoint] = useState<string>("");

  return (
    <>
      <Wrapper>
        <ModalCard>
          <CloseButton>
            <Button
              kind="no-border"
              onClick={() => {
                setModal(false);
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
              setModal(false);
            }}
            fullWidth
            kind="primary-transparent"
            style={{ height: "3rem" }}
          >
            Add
          </Button>
        </ModalCard>
      </Wrapper>
    </>
  );
};
const Wrapper = styled.div`
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: #00000064;
  display: flex;
  justify-content: center;
  align-items: center;
  inset: 0;
  z-index: 10;
`;
const ModalCard = styled.div`
  width: 25rem;
  height: max-content;
  background: #282a36;
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
export default CustomEndpoint;
