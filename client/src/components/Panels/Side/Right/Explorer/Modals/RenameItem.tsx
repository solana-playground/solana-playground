import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Modal from "../../../../../Modal";
import useModal from "../../../../../Modal/useModal";
import Input from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";
import { PgExplorer } from "../../../../../../utils/pg";
import { ClassName } from "../../../../../../constants";

interface RenameItemProps {
  path: string;
}

export const RenameItem: FC<RenameItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  const itemName = PgExplorer.getItemNameFromPath(path) ?? "";

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, itemName.indexOf("."));
    inputRef.current?.focus();
  }, [itemName]);

  // Handle user input
  const [newName, setNewName] = useState(itemName);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setError("");
  };

  const disableCond = !newName || !explorer || !!error;

  const rename = async () => {
    if (disableCond) return;

    try {
      await explorer.renameItem(path, newName);
      close();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!itemName) return null;

  return (
    <Modal
      buttonProps={{
        name: "Rename",
        onSubmit: rename,
        size: "small",
        disabled: disableCond,
      }}
    >
      <Content>
        <Text>Rename '{itemName}'</Text>
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
  margin-bottom: 1rem;

  & > input {
    font-size: ${({ theme }) => theme.font?.code?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;

const Text = styled.div`
  margin: 1rem 0;
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
