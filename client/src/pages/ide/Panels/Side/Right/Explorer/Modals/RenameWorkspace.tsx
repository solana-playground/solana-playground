import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Modal from "../../../../../../../components/Modal";
import useModal from "../../../../../../../components/Modal/useModal";
import Input from "../../../../../../../components/Input";
import { explorerAtom } from "../../../../../../../state";

export const RenameWorkspace = () => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select input on mount
  useEffect(() => {
    inputRef.current?.select();
    inputRef.current?.focus();
  }, []);

  const workspaceName = explorer?.currentWorkspaceName ?? "";

  // Handle user input
  const [newName, setNewName] = useState(workspaceName);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setError("");
  };

  const disableCond = !newName || !!error || !explorer;

  const renameWorkspace = async () => {
    if (disableCond) return;

    try {
      await explorer.renameWorkspace(newName);
      close();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal
      buttonProps={{
        name: "Rename",
        onSubmit: renameWorkspace,
        disabled: disableCond,
        size: "small",
      }}
      title={`Rename workspace '${workspaceName}'`}
    >
      <Content>
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={newName}
          error={error}
        />
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  margin: 1rem 0 1.5rem 0;

  & > input {
    padding: 0.375rem 0.5rem;
  }
`;
