import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Modal from "../../../../../../../components/Modal";
import useModal from "../../../../../../../components/Modal/useModal";
import Input from "../../../../../../../components/Input";
import { explorerAtom } from "../../../../../../../state";
import { ClassName } from "../../../../../../../constants";

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
        {error && <ErrorText>{error}</ErrorText>}
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={newName}
          className={error ? ClassName.ERROR : ""}
        />
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 1rem 0 1.5rem 0;

  & > input {
    padding: 0.375rem 0.5rem;
  }
`;

const ErrorText = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.state.error.color};
    font-size: ${theme.font?.code?.size.small};
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: flex-start;
    width: 100%;
  `}
`;
