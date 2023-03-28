import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Modal from "../../../../../../../components/Modal";
import useModal from "../../../../../../../components/Modal/useModal";
import Input from "../../../../../../../components/Input";
import { explorerAtom } from "../../../../../../../state";
import { PgRouter } from "../../../../../../../utils/pg";
import { Route } from "../../../../../../../constants";

export const ImportShared = () => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle user input
  const [name, setName] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const importNewWorkspace = async () => {
    if (!name || !explorer) return;

    try {
      await explorer.newWorkspace(name, { fromShared: true });
      PgRouter.navigate(Route.DEFAULT);
      close();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <Modal
      buttonProps={{
        text: "Import",
        onSubmit: importNewWorkspace,
        disabled: !name,
      }}
    >
      <Content>
        <MainText>Project name</MainText>
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={name}
          placeholder="shared project..."
        />
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 1rem;

  & > input {
    padding: 0.375rem 0.5rem;
  }
`;

const MainText = styled.div`
  margin: 1rem 0 0.5rem 0;
  font-weight: bold;
`;
