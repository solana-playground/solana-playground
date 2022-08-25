import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import ModalInside from "../../../../../Modal/ModalInside";
import useModal from "../../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";

export const RenameWorkspace = () => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.select();
    inputRef.current?.focus();
  }, []);

  const workspaceName = explorer?.currentWorkspaceName ?? "";
  // Handle user input
  const [newName, setNewName] = useState(workspaceName);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  };

  const renameWorkspace = async () => {
    if (!newName || !explorer) return;

    try {
      await explorer.renameWorkspace(newName);
      close();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <ModalInside
      buttonProps={{ name: "Rename", onSubmit: renameWorkspace }}
      title={`Rename workspace '${workspaceName}'`}
      closeOnSubmit={false}
    >
      <Content>
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={newName}
          {...defaultInputProps}
        />
      </Content>
    </ModalInside>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0;

  & > input {
    font-size: ${({ theme }) => theme.font?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;
