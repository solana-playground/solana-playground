import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import ModalInside from "../../../../../Modal/ModalInside";
import useModal from "../../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";
import { PgExplorer } from "../../../../../../utils/pg";

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
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  };

  const rename = async () => {
    if (!newName || !explorer) return;

    try {
      await explorer.renameItem(path, newName);

      close();
    } catch (e: any) {
      console.log(e.message);
    }
  };

  if (!itemName) return null;

  return (
    <ModalInside
      buttonProps={{ name: "Rename", onSubmit: rename, size: "small" }}
      closeOnSubmit={false}
    >
      <Content>
        <Text>Rename '{itemName}'</Text>
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
  margin-bottom: 1rem;

  & > input {
    font-size: ${({ theme }) => theme.font?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;

const Text = styled.div`
  margin: 1rem 0;
`;
