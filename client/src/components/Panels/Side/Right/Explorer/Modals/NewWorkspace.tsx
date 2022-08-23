import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import ModalInside from "../../../../../Modal/ModalInside";
import useModal from "../../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";

export const NewWorkspace = () => {
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

  const newWorkspace = async () => {
    if (!name || !explorer) return;

    try {
      await explorer.newWorkspace(name);
      close();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <ModalInside
      buttonProps={{ name: "Create", onSubmit: newWorkspace }}
      closeOnSubmit={false}
    >
      <Content>
        <Text>Workspace name:</Text>
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={name}
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
  margin-bottom: 1rem;

  & > input {
    font-size: ${({ theme }) => theme.font?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;

const Text = styled.div`
  margin: 1rem 0;
`;
