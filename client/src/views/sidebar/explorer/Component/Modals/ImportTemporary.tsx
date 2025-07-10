import { useState } from "react";
import styled from "styled-components";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import { PgExplorer } from "../../../../../utils/pg";

export const ImportTemporary = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const importTemporary = async () => {
    await PgExplorer.createWorkspace(name, { fromTemporary: true });
  };

  return (
    <Modal
      title
      buttonProps={{
        text: "Import",
        onSubmit: importTemporary,
        disabled: !!error,
      }}
    >
      <MainText>Project name</MainText>
      <Input
        autoFocus
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        validator={PgExplorer.isWorkspaceNameValid}
        error={error}
        setError={setError}
        placeholder="project name..."
      />
    </Modal>
  );
};

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;
