import { ChangeEvent, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import Modal from "../../../../../../../components/Modal";
import Input from "../../../../../../../components/Input";
import { PgExplorer } from "../../../../../../../utils/pg";

export const ImportTemporary = () => {
  // Handle user input
  const [name, setName] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);
  };

  const importTemporary = async () => {
    await PgExplorer.newWorkspace(name, { fromTemporary: true });
  };

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Modal
      buttonProps={{
        text: "Import",
        onSubmit: importTemporary,
        disabled: !name,
        closeOnSubmit: true,
      }}
      title
    >
      <MainText>Project name</MainText>
      <Input
        ref={inputRef}
        onChange={handleChange}
        value={name}
        placeholder="project name..."
      />
    </Modal>
  );
};

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;
