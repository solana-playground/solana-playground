import { ChangeEvent, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import Modal from "../../../../../../../components/Modal";
import Input from "../../../../../../../components/Input";
import { PgExplorer, PgRouter } from "../../../../../../../utils/pg";
import { Route } from "../../../../../../../constants";

export const ImportShared = () => {
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
    try {
      await PgExplorer.newWorkspace(name, { fromShared: true });
      PgRouter.navigate();
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
        closeOnSubmit: true,
      }}
      title
    >
      <MainText>Project name</MainText>
      <Input
        ref={inputRef}
        onChange={handleChange}
        value={name}
        placeholder="shared project..."
      />
    </Modal>
  );
};

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;
