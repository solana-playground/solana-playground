import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import styled from "styled-components";

import ModalInside from "../../../../../Modal/ModalInside";
import useModal from "../../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";

export const ImportShared = () => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const navigate = useNavigate();

  // Handle user input
  const [name, setName] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const importNewWorkspace = async () => {
    if (!name || !explorer) return;

    try {
      await explorer.newWorkspace(name, { fromShared: true });
      navigate("/");
      close();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <ModalInside
      buttonProps={{
        name: "Import",
        onSubmit: importNewWorkspace,
        disabled: !name,
      }}
      closeOnSubmit={false}
    >
      <Content>
        <MainText>Project name</MainText>
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={name}
          placeholder="shared project..."
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
  margin-bottom: 1rem;

  & > input {
    font-size: ${({ theme }) => theme.font?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;

const MainText = styled.div`
  margin: 1rem 0 0.5rem 0;
  font-weight: bold;
`;
